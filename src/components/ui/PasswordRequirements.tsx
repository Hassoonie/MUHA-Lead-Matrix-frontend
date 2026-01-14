"use client";

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export default function PasswordRequirements({ password, className = "" }: PasswordRequirementsProps) {
  const requirements: Requirement[] = [
    {
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      label: "At least one uppercase letter (A-Z)",
      met: /[A-Z]/.test(password),
    },
    {
      label: "At least one lowercase letter (a-z)",
      met: /[a-z]/.test(password),
    },
    {
      label: "At least one number (0-9)",
      met: /[0-9]/.test(password),
    },
    {
      label: "At least one special character (!@#$%^&*)",
      met: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    },
  ];

  const allMet = requirements.every((req) => req.met);

  return (
    <div className={`mt-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      <p className="text-xs font-semibold text-black dark:text-white mb-2">Password Requirements:</p>
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <svg
                className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span
              className={
                req.met
                  ? "text-green-700 dark:text-green-400"
                  : "text-gray-600 dark:text-gray-400"
              }
            >
              {req.label}
            </span>
          </li>
        ))}
      </ul>
      {allMet && password.length > 0 && (
        <p className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
          ✓ All requirements met!
        </p>
      )}
    </div>
  );
}
