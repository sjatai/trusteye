// OAuth Routes for Social Media Integrations
// Supports Instagram (via Facebook), LinkedIn, and Twitter/X

import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

// In-memory storage for OAuth states and tokens (use Redis/DB in production)
const oauthStates = new Map<string, { provider: string; timestamp: number }>();
const connectedAccounts = new Map<string, {
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  profile?: {
    id: string;
    name: string;
    username?: string;
    profileUrl?: string;
  };
  connectedAt: string;
}>();

// OAuth Configuration
const getOAuthConfig = (provider: string) => {
  const baseUrl = process.env.API_BASE_URL || 'https://api-production-26c1.up.railway.app';
  const frontendUrl = process.env.FRONTEND_URL || 'https://trusteye.ai';

  const configs: Record<string, any> = {
    instagram: {
      // Instagram uses Facebook's OAuth (Instagram Graph API)
      clientId: process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET,
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
      redirectUri: `${baseUrl}/api/oauth/instagram/callback`,
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      scope: 'openid profile email w_member_social',
      redirectUri: `${baseUrl}/api/oauth/linkedin/callback`,
    },
    twitter: {
      // Twitter/X OAuth 2.0
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      scope: 'tweet.read tweet.write users.read offline.access',
      redirectUri: `${baseUrl}/api/oauth/twitter/callback`,
    },
  };

  return configs[provider];
};

// Generate state for CSRF protection
const generateState = (provider: string): string => {
  const state = crypto.randomBytes(32).toString('hex');
  oauthStates.set(state, { provider, timestamp: Date.now() });
  // Clean up old states (older than 10 minutes)
  for (const [key, value] of oauthStates.entries()) {
    if (Date.now() - value.timestamp > 10 * 60 * 1000) {
      oauthStates.delete(key);
    }
  }
  return state;
};

// Validate state
const validateState = (state: string, provider: string): boolean => {
  const stateData = oauthStates.get(state);
  if (!stateData) return false;
  if (stateData.provider !== provider) return false;
  if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
    oauthStates.delete(state);
    return false;
  }
  oauthStates.delete(state);
  return true;
};

// GET /api/oauth/status - Get status of all integrations
router.get('/status', (req: Request, res: Response) => {
  const integrations = ['instagram', 'linkedin', 'twitter'].map(provider => {
    const account = connectedAccounts.get(provider);
    const config = getOAuthConfig(provider);

    return {
      provider,
      connected: !!account,
      configured: !!(config?.clientId && config?.clientSecret),
      profile: account?.profile || null,
      connectedAt: account?.connectedAt || null,
    };
  });

  res.json({
    success: true,
    integrations,
  });
});

// GET /api/oauth/:provider/connect - Initiate OAuth flow
router.get('/:provider/connect', (req: Request, res: Response) => {
  const { provider } = req.params;
  const config = getOAuthConfig(provider);

  if (!config) {
    return res.status(400).json({
      success: false,
      error: `Unknown provider: ${provider}`,
    });
  }

  if (!config.clientId || !config.clientSecret) {
    return res.status(400).json({
      success: false,
      error: `${provider} is not configured. Please add ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET to your environment variables.`,
      setup: getSetupInstructions(provider),
    });
  }

  const state = generateState(provider);

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    response_type: 'code',
    state,
  });

  // Twitter requires PKCE
  if (provider === 'twitter') {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
    // Store code verifier with state
    oauthStates.set(state, { provider, timestamp: Date.now(), codeVerifier } as any);
  }

  const authUrl = `${config.authUrl}?${params.toString()}`;

  res.json({
    success: true,
    authUrl,
    message: `Redirect user to this URL to authorize ${provider}`,
  });
});

// GET /api/oauth/:provider/callback - Handle OAuth callback
router.get('/:provider/callback', async (req: Request, res: Response) => {
  const { provider } = req.params;
  const { code, state, error, error_description } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'https://trusteye.ai';

  if (error) {
    return res.redirect(`${frontendUrl}/integrations?error=${encodeURIComponent(error_description as string || error as string)}`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/integrations?error=Missing authorization code or state`);
  }

  if (!validateState(state as string, provider)) {
    return res.redirect(`${frontendUrl}/integrations?error=Invalid or expired state`);
  }

  const config = getOAuthConfig(provider);
  if (!config) {
    return res.redirect(`${frontendUrl}/integrations?error=Unknown provider`);
  }

  try {
    // Exchange code for tokens
    const tokenParams: Record<string, string> = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code as string,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    };

    // Twitter requires code verifier for PKCE
    if (provider === 'twitter') {
      const stateData = oauthStates.get(state as string) as any;
      if (stateData?.codeVerifier) {
        tokenParams.code_verifier = stateData.codeVerifier;
      }
    }

    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(provider === 'twitter' ? {
          'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
        } : {}),
      },
      body: new URLSearchParams(tokenParams).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error(`OAuth token error for ${provider}:`, tokenData);
      return res.redirect(`${frontendUrl}/integrations?error=${encodeURIComponent(tokenData.error_description || tokenData.error || 'Failed to get access token')}`);
    }

    // Fetch user profile
    const profile = await fetchUserProfile(provider, tokenData.access_token);

    // Store the connection
    connectedAccounts.set(provider, {
      provider,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined,
      profile,
      connectedAt: new Date().toISOString(),
    });

    console.log(`Successfully connected ${provider} for ${profile?.name || 'user'}`);

    res.redirect(`${frontendUrl}/integrations?success=${provider}&name=${encodeURIComponent(profile?.name || provider)}`);
  } catch (error: any) {
    console.error(`OAuth callback error for ${provider}:`, error);
    res.redirect(`${frontendUrl}/integrations?error=${encodeURIComponent(error.message || 'OAuth failed')}`);
  }
});

// POST /api/oauth/:provider/disconnect - Disconnect integration
router.post('/:provider/disconnect', (req: Request, res: Response) => {
  const { provider } = req.params;

  if (!connectedAccounts.has(provider)) {
    return res.status(404).json({
      success: false,
      error: `${provider} is not connected`,
    });
  }

  connectedAccounts.delete(provider);

  res.json({
    success: true,
    message: `${provider} disconnected successfully`,
  });
});

// POST /api/oauth/:provider/post - Post content to social media
router.post('/:provider/post', async (req: Request, res: Response) => {
  const { provider } = req.params;
  const { content, mediaUrl } = req.body;

  const account = connectedAccounts.get(provider);
  if (!account) {
    return res.status(401).json({
      success: false,
      error: `${provider} is not connected. Please connect first.`,
    });
  }

  try {
    let result;

    switch (provider) {
      case 'twitter':
        result = await postToTwitter(account.accessToken, content);
        break;
      case 'linkedin':
        result = await postToLinkedIn(account.accessToken, content, account.profile?.id);
        break;
      case 'instagram':
        // Instagram requires media
        if (!mediaUrl) {
          return res.status(400).json({
            success: false,
            error: 'Instagram posts require a media URL',
          });
        }
        result = await postToInstagram(account.accessToken, content, mediaUrl);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Posting to ${provider} is not supported`,
        });
    }

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error(`Post error for ${provider}:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to post content',
    });
  }
});

// Helper function to fetch user profile
async function fetchUserProfile(provider: string, accessToken: string): Promise<any> {
  try {
    switch (provider) {
      case 'instagram': {
        // Get Instagram account via Facebook Graph API
        const response = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account{id,name,username}&access_token=${accessToken}`
        );
        const data = await response.json();
        const igAccount = data.data?.[0]?.instagram_business_account;
        return {
          id: igAccount?.id || 'pending',
          name: igAccount?.name || 'Instagram Business',
          username: igAccount?.username,
        };
      }
      case 'linkedin': {
        const response = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();
        return {
          id: data.sub,
          name: data.name,
          profileUrl: data.picture,
        };
      }
      case 'twitter': {
        const response = await fetch('https://api.twitter.com/2/users/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();
        return {
          id: data.data?.id,
          name: data.data?.name,
          username: data.data?.username,
        };
      }
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error fetching ${provider} profile:`, error);
    return null;
  }
}

// Helper functions to post to each platform
async function postToTwitter(accessToken: string, content: string) {
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: content }),
  });
  return response.json();
}

async function postToLinkedIn(accessToken: string, content: string, userId?: string) {
  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: `urn:li:person:${userId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }),
  });
  return response.json();
}

async function postToInstagram(accessToken: string, caption: string, mediaUrl: string) {
  // Instagram posting is a two-step process:
  // 1. Create media container
  // 2. Publish the container
  // This requires Instagram Business Account connected via Facebook

  // This is a simplified version - full implementation needs the Instagram Business Account ID
  return {
    success: false,
    message: 'Instagram posting requires additional setup. Please ensure you have an Instagram Business Account connected to a Facebook Page.',
  };
}

// Get setup instructions for each provider
function getSetupInstructions(provider: string) {
  const baseUrl = process.env.API_BASE_URL || 'https://api-production-26c1.up.railway.app';

  const instructions: Record<string, any> = {
    instagram: {
      steps: [
        '1. Go to https://developers.facebook.com/',
        '2. Create a new app or select existing app',
        '3. Add "Instagram Graph API" product',
        `4. Configure OAuth redirect: ${baseUrl}/api/oauth/instagram/callback`,
        '5. Copy App ID and App Secret',
      ],
      envVars: [
        'INSTAGRAM_CLIENT_ID=your_facebook_app_id',
        'INSTAGRAM_CLIENT_SECRET=your_facebook_app_secret',
      ],
      docs: 'https://developers.facebook.com/docs/instagram-api/getting-started',
    },
    linkedin: {
      steps: [
        '1. Go to https://www.linkedin.com/developers/',
        '2. Create a new app',
        '3. Request "Sign In with LinkedIn using OpenID Connect" and "Share on LinkedIn" products',
        `4. Add OAuth 2.0 redirect URL: ${baseUrl}/api/oauth/linkedin/callback`,
        '5. Copy Client ID and Client Secret',
      ],
      envVars: [
        'LINKEDIN_CLIENT_ID=your_client_id',
        'LINKEDIN_CLIENT_SECRET=your_client_secret',
      ],
      docs: 'https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow',
    },
    twitter: {
      steps: [
        '1. Go to https://developer.twitter.com/en/portal/dashboard',
        '2. Create a new project and app',
        '3. Enable OAuth 2.0 in User authentication settings',
        `4. Set callback URL: ${baseUrl}/api/oauth/twitter/callback`,
        '5. Copy Client ID and Client Secret',
      ],
      envVars: [
        'TWITTER_CLIENT_ID=your_client_id',
        'TWITTER_CLIENT_SECRET=your_client_secret',
      ],
      docs: 'https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code',
    },
  };

  return instructions[provider];
}

// GET /api/oauth/:provider/setup - Get setup instructions
router.get('/:provider/setup', (req: Request, res: Response) => {
  const { provider } = req.params;
  const instructions = getSetupInstructions(provider);

  if (!instructions) {
    return res.status(400).json({
      success: false,
      error: `Unknown provider: ${provider}`,
    });
  }

  const config = getOAuthConfig(provider);

  res.json({
    success: true,
    provider,
    configured: !!(config?.clientId && config?.clientSecret),
    instructions,
  });
});

export default router;
