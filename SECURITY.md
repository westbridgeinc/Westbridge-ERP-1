# Security Policy

Westbridge takes the security of **Westbridge ERP Platform** and all related products and services seriously. We appreciate the security community's efforts in helping us maintain a secure platform for our users.

## Supported Versions

| Version        | Supported          |
| -------------- | ------------------ |
| Latest release | :white_check_mark: Fully supported |
| Previous minor | :white_check_mark: Security patches only |
| Older versions | :x: Not supported  |

We recommend all users run the latest version to benefit from the most recent security improvements and patches.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Instead, please report vulnerabilities via email to:

**[security@westbridge.co](mailto:security@westbridge.co)**

When reporting, please include as much of the following information as possible to help us understand and reproduce the issue:

- Type of vulnerability (e.g., SQL injection, cross-site scripting, authentication bypass)
- Full paths of affected source file(s), if known
- The location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code, if available
- Impact assessment of the vulnerability
- Any suggested remediation or mitigation

## Response Timeline

We are committed to responding to vulnerability reports in a timely manner:

| Stage                    | Timeline                  |
| ------------------------ | ------------------------- |
| Acknowledgement          | Within **48 hours**       |
| Initial assessment       | Within **5 business days** |
| Status update (ongoing)  | Every **10 business days** |
| Resolution target        | Within **90 days**        |

If a vulnerability is accepted, we will work with you to understand the issue fully and develop an appropriate fix. If the report is declined, we will provide a clear explanation.

## Responsible Disclosure Policy

We kindly ask researchers to:

- **Allow us reasonable time** to investigate and address the vulnerability before making any public disclosure.
- **Make a good faith effort** to avoid privacy violations, data destruction, and disruption of services during your research.
- **Only interact with accounts you own** or with explicit permission from the account holder.
- **Do not access, modify, or delete data** belonging to other users.
- **Stop testing and report immediately** if you encounter any user data during your research.

We will coordinate public disclosure with you after a fix has been released. We aim to publish security advisories promptly and transparently.

## Out of Scope

The following are considered out of scope for our vulnerability reporting program:

- Denial of service (DoS/DDoS) attacks
- Social engineering attacks (e.g., phishing) against Westbridge employees or contractors
- Physical attacks against Westbridge offices or data centers
- Vulnerabilities in third-party applications, services, or libraries that are not under our control
- Automated scanning results without a demonstrated proof of concept
- Reports from automated vulnerability scanners without manual verification
- Clickjacking on pages with no sensitive actions
- Missing HTTP security headers that do not lead to a direct vulnerability
- Reports about SSL/TLS configuration best practices without a demonstrated attack
- Content spoofing or text injection without demonstrating an attack vector
- Rate limiting or brute force issues on non-authentication endpoints
- Missing best practices without demonstrating a security impact
- Vulnerabilities affecting users of unsupported or outdated browsers

## Safe Harbor

Westbridge supports safe harbor for security researchers who:

- Act in good faith to avoid privacy violations, destruction of data, and disruption of our services.
- Only interact with accounts they own or with explicit authorization from the account holder.
- Report vulnerabilities to us through the designated channel (security@westbridge.co) before disclosing them publicly.
- Comply with this security policy and all applicable laws.

We will consider activities conducted consistent with this policy to be "authorized" and will not pursue civil action or initiate a complaint to law enforcement against researchers who comply with this policy. We will help to the extent we can if legal action is initiated by a third party against you for activities that were conducted in accordance with this policy.

If at any time you have concerns or are uncertain whether your security research is consistent with this policy, please submit a report to [security@westbridge.co](mailto:security@westbridge.co) before going any further.

## Recognition / Hall of Fame

We value the contributions of security researchers who help us keep Westbridge ERP secure. Researchers who report valid security vulnerabilities may be:

- Acknowledged in our Security Hall of Fame (with your permission)
- Credited in the relevant security advisory
- Eligible for recognition based on the severity and impact of the finding

If you would like to be recognized for your contribution, please let us know in your report.

## Compliance

Westbridge maintains compliance with industry security standards. For information about our SOC 2 compliance and related security policies, please refer to our compliance documentation located in [`docs/policies/`](docs/policies/).

## Contact

For all security-related inquiries, contact **[security@westbridge.co](mailto:security@westbridge.co)**.
