export default function PasswordStrengthHint({ password }) {
  const rules = [
    { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
    { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
    { label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
    { label: 'One number', test: (pw) => /[0-9]/.test(pw) },
    { label: 'One special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) }
  ];

  return (
    <ul className="text-xs mb-3 space-y-1">
      {rules.map((rule) => {
        const passed = rule.test(password || '');
        return (
          <li key={rule.label} className={passed ? 'text-green-600' : 'text-gray-400'}>
            {passed ? '✓' : '○'} {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
