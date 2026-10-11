const SENTIMENT_STYLES = {
  positive: 'bg-green-100 text-green-700',
  neutral: 'bg-gray-100 text-gray-500',
  negative: 'bg-orange-100 text-orange-700',
  frustrated: 'bg-red-100 text-red-700'
};

const SENTIMENT_ICONS = {
  positive: '🙂',
  neutral: '😐',
  negative: '😕',
  frustrated: '😤'
};

export default function SentimentBadge({ sentiment }) {
  if (!sentiment) return null;
  return (
    <span
      title={`Sentiment: ${sentiment}`}
      className={`text-[10px] px-1.5 py-0.5 rounded-full ${SENTIMENT_STYLES[sentiment] || SENTIMENT_STYLES.neutral}`}
    >
      {SENTIMENT_ICONS[sentiment]} {sentiment}
    </span>
  );
}
