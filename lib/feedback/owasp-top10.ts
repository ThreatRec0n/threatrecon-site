// OWASP Top 10 2021 definitions for educational references

export interface OwaspCategory {
  id: string;
  name: string;
  description: string;
  examples: string[];
  url: string;
}

export const OWASP_TOP_10: Record<string, OwaspCategory> = {
  "A01:2021": {
    id: "A01:2021",
    name: "Broken Access Control",
    description: "Restrictions on what authenticated users can do are often not properly enforced. Attackers can exploit these flaws to access unauthorized functionality or data.",
    examples: [
      "Privilege escalation",
      "Unauthorized data access",
      "API security failures",
      "Insecure direct object references"
    ],
    url: "https://owasp.org/Top10/A01_2021-Broken_Access_Control/"
  },
  "A02:2021": {
    id: "A02:2021",
    name: "Cryptographic Failures",
    description: "Failures related to cryptography which often lead to exposure of sensitive data. This includes weak encryption, improper key management, and exposure of sensitive data.",
    examples: [
      "Weak encryption algorithms",
      "Improper key management",
      "Exposure of sensitive data",
      "Insecure data transmission"
    ],
    url: "https://owasp.org/Top10/A02_2021-Cryptographic_Failures/"
  },
  "A03:2021": {
    id: "A03:2021",
    name: "Injection",
    description: "User-supplied data is not validated, filtered, or sanitized by the application. This allows attackers to inject malicious code or commands.",
    examples: [
      "SQL injection",
      "Cross-site scripting (XSS)",
      "Command injection",
      "LDAP injection"
    ],
    url: "https://owasp.org/Top10/A03_2021-Injection/"
  },
  "A04:2021": {
    id: "A04:2021",
    name: "Insecure Design",
    description: "Missing or ineffective control design focused on risks related to design flaws. This includes lack of threat modeling and secure design patterns.",
    examples: [
      "Threat modeling gaps",
      "Secure design patterns not followed",
      "Defense in depth missing",
      "Insecure default configurations"
    ],
    url: "https://owasp.org/Top10/A04_2021-Insecure_Design/"
  },
  "A05:2021": {
    id: "A05:2021",
    name: "Security Misconfiguration",
    description: "Security misconfiguration is the most commonly seen issue. This includes insecure default configurations, incomplete configurations, and exposed sensitive information.",
    examples: [
      "Insecure default configurations",
      "Incomplete configurations",
      "Exposed sensitive information",
      "Unnecessary features enabled"
    ],
    url: "https://owasp.org/Top10/A05_2021-Security_Misconfiguration/"
  },
  "A06:2021": {
    id: "A06:2021",
    name: "Vulnerable and Outdated Components",
    description: "Using components with known vulnerabilities, including libraries, frameworks, and software modules. Attackers can exploit these vulnerabilities to compromise systems.",
    examples: [
      "Outdated libraries",
      "Known vulnerabilities",
      "Unpatched software",
      "Unmaintained dependencies"
    ],
    url: "https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/"
  },
  "A07:2021": {
    id: "A07:2021",
    name: "Identification and Authentication Failures",
    description: "Confirmation of user identity, authentication, and session management. Failures in these areas allow attackers to compromise passwords, keys, or session tokens.",
    examples: [
      "Credential stuffing",
      "Weak passwords",
      "Session hijacking",
      "Authentication bypass"
    ],
    url: "https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/"
  },
  "A08:2021": {
    id: "A08:2021",
    name: "Software and Data Integrity Failures",
    description: "Failures related to software and data integrity. This includes insecure CI/CD pipelines, untrusted dependencies, and lack of integrity verification.",
    examples: [
      "Insecure CI/CD pipelines",
      "Untrusted dependencies",
      "Lack of integrity verification",
      "Supply chain attacks"
    ],
    url: "https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/"
  },
  "A09:2021": {
    id: "A09:2021",
    name: "Security Logging and Monitoring Failures",
    description: "Insufficient logging and monitoring. This makes it difficult to detect, respond to, and recover from security incidents.",
    examples: [
      "Insufficient logging",
      "Missing security monitoring",
      "Inadequate alerting",
      "Log tampering"
    ],
    url: "https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/"
  },
  "A10:2021": {
    id: "A10:2021",
    name: "Server-Side Request Forgery (SSRF)",
    description: "SSRF flaws occur when a web application fetches a remote resource without validating the user-supplied URL. Attackers can exploit this to access internal systems.",
    examples: [
      "Internal network scanning",
      "Access to internal services",
      "Cloud metadata access",
      "Bypass firewall restrictions"
    ],
    url: "https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery/"
  }
};

/**
 * Get OWASP Top 10 category details by ID
 */
export function getOwaspCategory(categoryId: string): OwaspCategory | undefined {
  return OWASP_TOP_10[categoryId];
}

