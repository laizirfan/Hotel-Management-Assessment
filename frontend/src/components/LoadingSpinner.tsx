import './LoadingSpinner.css';

type Props = {
  text?: string;
};

function LoadingSpinner({ text = 'Loading...' }: Props) {
  return (
    <span className="loading-content">
      <span className="bar-spinner" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            style={{ transform: `rotate(${i * 30}deg)` }}
          />
        ))}
      </span>
      <span>{text}</span>
    </span>
  );
}

export default LoadingSpinner;