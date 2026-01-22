import { ArrowUp, Zap } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { StarsIcon } from './StarsIcon';

interface CommandBoxProps {
  onSubmit: (query: string) => void;
  placeholder?: string;
  position?: 'top' | 'bottom';
  onPositionChange?: (position: 'top' | 'bottom') => void;
}

export function CommandBox({
  onSubmit,
  placeholder = "What do you want to achieve today?",
  position = 'bottom',
  onPositionChange
}: CommandBoxProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea like Atlas
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(query);
      setQuery('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Subtle glow container */}
      <div className={`relative transition-all duration-300 ${
        isFocused
          ? 'drop-shadow-[0_0_20px_rgba(14,165,233,0.15)]'
          : 'drop-shadow-[0_0_12px_rgba(14,165,233,0.08)]'
      }`}>
        {/* Animated gradient border */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 rounded-xl opacity-60 blur-[1px]" />

        {/* Main command box */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200">
            {/* AI Icon with pulse animation */}
            <div className="flex-shrink-0 mt-1.5">
              <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-sky-50 to-teal-50 border border-sky-200 flex items-center justify-center">
                <StarsIcon className="w-5 h-5 text-sky-600" />
                {/* Subtle pulse ring */}
                <div className="absolute inset-0 rounded-lg bg-sky-400 opacity-0 animate-[ping_2s_ease-in-out_infinite]" />
              </div>
            </div>

            {/* Textarea Field - Auto-expanding */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                rows={2}
                className="w-full px-0 py-2.5 text-[15px] bg-transparent border-none focus:outline-none resize-none overflow-hidden leading-relaxed text-slate-900 placeholder:text-slate-400"
                style={{ minHeight: '56px', maxHeight: '200px' }}
              />

              {/* Keyboard shortcut hint */}
              {!query && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[11px] text-slate-400 pointer-events-none">
                  <Zap className="w-3 h-3" />
                  <span>Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-medium">Enter</kbd> to send</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!query.trim()}
              className={`flex-shrink-0 w-10 h-10 mt-1.5 rounded-lg flex items-center justify-center transition-all ${
                query.trim()
                  ? 'bg-gradient-to-br from-sky-500 to-teal-500 text-white shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 hover:scale-105'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Helper text */}
      <div className="mt-3 text-center">
        <p className="text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <StarsIcon className="w-3 h-3 text-sky-500" />
            AI-powered marketing assistant ready to help
          </span>
        </p>
      </div>
    </div>
  );
}
