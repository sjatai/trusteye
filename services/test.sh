#!/bin/bash

echo "🧪 Testing KQ Studio Campaign Service"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📡 Sending request..."
echo ""

curl -X POST http://localhost:3001/api/campaigns/create \
  -H "Content-Type: application/json" \
  -d '{"goal": "Create a win-back campaign for inactive premium customers"}' \
  | jq .

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test complete!"
echo ""
echo "Check:"
echo "  📧 Email: sumitjain@gmail.com"
echo "  💬 Slack: Your workspace"
