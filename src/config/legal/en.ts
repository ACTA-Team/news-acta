import { siteConfig } from '@/config/site';
import type { LegalCopy } from './types';

/**
 * English legal copy. Ported verbatim from the previous JSX pages, so the
 * substance and the section numbering are unchanged; only the container is new.
 *
 * Not legal advice: have counsel review this for your entity.
 */

const siteHost = siteConfig.url.replace(/^https?:\/\//, '');

export const legalCopyEn: LegalCopy = {
  terms: {
    title: 'Terms of Service',
    intro: [
      {
        type: 'p',
        text: `These Terms of Service ("Terms") form a legal agreement between you and ACTA ("ACTA," "we," "us," or "our") regarding your access to and use of the ${siteConfig.name} website, associated applications, and related services (collectively, the "Services"). If you do not agree, do not use the Services.`,
      },
      {
        type: 'p',
        text: 'These Terms describe important rights and obligations. We encourage you to read them carefully and, where appropriate, to obtain independent legal advice. Nothing here creates a partnership, agency, or joint venture.',
      },
    ],
    sections: [
      {
        heading: '1. Acceptance and changes',
        blocks: [
          {
            type: 'p',
            text: 'By creating an account, accessing, or using the Services, you agree to these Terms and our Privacy Policy. We may change these Terms from time to time. We will post the updated Terms on this page and update the "Last updated" date. Your continued use after changes become effective constitutes acceptance of the revised Terms. If you do not agree, you must stop using the Services.',
          },
        ],
      },
      {
        heading: '2. The Services',
        blocks: [
          {
            type: 'p',
            text: `${siteConfig.name} publishes editorial and informational content, including news, articles, and periodic reviews. We may add, modify, or discontinue features, content, or integrations. The Services are provided on an "as is" and "as available" basis to the maximum extent permitted by law.`,
          },
        ],
      },
      {
        heading: '3. Eligibility',
        blocks: [
          {
            type: 'p',
            text: 'You may use the Services only if you can form a binding contract with ACTA under applicable law. If you use the Services on behalf of an organization, you represent that you have authority to bind that organization, and "you" includes the organization. You must not use the Services if you are prohibited from doing so by applicable sanctions, export, or other laws.',
          },
        ],
      },
      {
        heading: '4. Accounts and access',
        blocks: [
          {
            type: 'p',
            text: 'Certain features may require an account. You are responsible for maintaining the confidentiality of your credentials, for all activity under your account, and for providing accurate information. You must notify us promptly of any unauthorized use. We may suspend or terminate access if we reasonably believe you have violated these Terms, pose a security risk, or if required by law. Authentication flows (including social sign-in) may be provided by third parties; their use is also subject to their terms and policies.',
          },
        ],
      },
      {
        heading: '5. Acceptable use',
        blocks: [
          { type: 'p', text: 'You agree not to:' },
          {
            type: 'ul',
            items: [
              'Violate any law, regulation, or third-party rights',
              "Attempt to gain unauthorized access to the Services, systems, or other users' data",
              'Interfere with or disrupt the Services, including by transmitting malware, spam, or harmful code',
              'Scrape, index, or collect data in bulk without our prior written consent, where such use is prohibited',
              'Impersonate any person or entity, or misrepresent your affiliation',
              'Use the Services to build a competing product or to reverse engineer the Services, except where such restriction is unenforceable under applicable law',
            ],
          },
        ],
      },
      {
        heading: '6. Content and intellectual property',
        blocks: [
          { type: 'h3', text: 'Our content' },
          {
            type: 'p',
            text: 'Text, graphics, logos, and other materials made available by ACTA through the Services (excluding third-party or user content as identified) are owned by ACTA or our licensors and are protected by copyright, trademark, and other laws. You may not copy, modify, distribute, or create derivative works except as allowed by us in writing or as permitted for sharing via built-in features (e.g. links and ordinary browser viewing).',
          },
          { type: 'h3', text: 'Your content' },
          {
            type: 'p',
            text: 'If you submit content to us (e.g. comments, contributions, or materials for publication), you grant ACTA a worldwide, non-exclusive, royalty-free license to use, host, reproduce, modify, display, and distribute such content for the purpose of operating, promoting, and improving the Services. You represent that you have the rights to grant this license. You retain ownership of your content subject to the license above.',
          },
        ],
      },
      {
        heading: '7. Third-party links and services',
        blocks: [
          {
            type: 'p',
            text: 'The Services may link to or integrate third-party sites, services, or content. We do not control and are not responsible for third parties. Your use of third-party services is at your own risk and subject to their terms and privacy practices.',
          },
        ],
      },
      {
        heading: '8. Disclaimers',
        blocks: [
          {
            type: 'p',
            text: 'THE SERVICES AND ALL CONTENT ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. ACTA DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR FREE, OR FREE OF HARMFUL COMPONENTS. EDITORIAL CONTENT IS FOR INFORMATIONAL PURPOSES; IT IS NOT LEGAL, FINANCIAL, INVESTMENT, OR PROFESSIONAL ADVICE.',
          },
        ],
      },
      {
        heading: '9. Limitation of liability',
        blocks: [
          {
            type: 'p',
            text: 'TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL ACTA, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS OPPORTUNITY, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICES, WHETHER IN CONTRACT, TORT, OR OTHERWISE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.',
          },
          {
            type: 'p',
            text: 'OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING OUT OF OR RELATING TO THE SERVICES OR THESE TERMS WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US FOR THE SERVICES DURING THE TWELVE (12) MONTHS BEFORE THE CLAIM, OR (B) FIFTY U.S. DOLLARS (US $50.00), IF THE SERVICES WERE FREE TO USE. SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS; IN THOSE JURISDICTIONS, OUR LIABILITY IS LIMITED TO THE MAXIMUM EXTENT PERMITTED BY LAW.',
          },
        ],
      },
      {
        heading: '10. Indemnity',
        blocks: [
          {
            type: 'p',
            text: "You will defend, indemnify, and hold harmless ACTA and its affiliates, officers, directors, and employees from and against any claims, damages, losses, or expenses (including reasonable attorneys' fees) arising out of your use of the Services, your content, or your violation of these Terms or applicable law, except to the extent caused by our gross negligence or willful misconduct.",
          },
        ],
      },
      {
        heading: '11. Governing law; dispute resolution',
        blocks: [
          {
            type: 'p',
            text: 'These Terms are governed by the laws of the State of California and the United States, without regard to conflict of law rules. The United Nations Convention on Contracts for the International Sale of Goods does not apply. Subject to applicable law, the exclusive jurisdiction and venue for disputes arising from these Terms or the Services will be the state and federal courts located in San Francisco County, California, and you consent to personal jurisdiction in those courts. If you are a consumer, mandatory consumer protections in your country of residence may still apply to you; nothing in this section limits those rights.',
          },
        ],
      },
      {
        heading: '12. General',
        blocks: [
          {
            type: 'p',
            text: 'These Terms, together with our Privacy Policy, constitute the entire agreement between you and ACTA regarding the Services. If a provision is held invalid, the remainder remains in effect. Our failure to enforce a right is not a waiver. You may not assign these Terms without our consent; we may assign them in connection with a merger, acquisition, or sale of assets. Section headings are for convenience only.',
          },
        ],
      },
      {
        heading: '13. Contact',
        blocks: [
          {
            type: 'p',
            text: 'For questions about these Terms, contact us through the channels provided on our website at [acta.build](https://acta.build).',
          },
        ],
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    intro: [
      {
        type: 'p',
        text: `This Privacy Policy explains how ACTA ("we," "us," or "our") processes personal information when you visit, use, or interact with ${siteConfig.name} and related services (the "Services"), including at [${siteHost}](${siteConfig.url}). By using the Services, you agree to the practices described here. If you do not agree, please do not use the Services.`,
      },
      {
        type: 'p',
        text: 'We process personal information in accordance with applicable data protection laws. Depending on your location, you may have specific rights, which are summarized below.',
      },
    ],
    sections: [
      {
        heading: '1. Who we are',
        blocks: [
          {
            type: 'p',
            text: 'ACTA operates the Services in connection with its ecosystem of products and public communications. For the purposes of the EU/UK General Data Protection Regulation ("GDPR"), ACTA is typically the data controller of personal information we determine the purposes and means of processing for the Services, unless a separate agreement states otherwise. Contact details: see Section 12.',
          },
        ],
      },
      {
        heading: '2. Information we collect',
        blocks: [
          { type: 'h3', text: '2.1 You provide to us' },
          {
            type: 'ul',
            items: [
              'Account and authentication data, such as email address, name, and sign-in method',
              'Content you send us (e.g. editorial submissions, feedback, or support messages) and related metadata',
              'Preferences you set (e.g. display or communication preferences) where we offer them',
            ],
          },
          { type: 'h3', text: '2.2 Collected automatically' },
          {
            type: 'ul',
            items: [
              'Device and log data, such as IP address, browser type, operating system, and timestamps',
              'Usage data, such as pages viewed, links clicked, referring URLs, and general interaction patterns',
              'Cookies and similar technologies (see Section 5), including information needed for security, session continuity, and analytics where enabled',
            ],
          },
          { type: 'h3', text: '2.3 From third parties' },
          {
            type: 'p',
            text: 'If you use social or single sign-on providers, we may receive a limited set of data from those providers as permitted by your settings and their policies (for example, profile identifiers and email). We may also receive aggregated or business contact information from partners where lawful.',
          },
        ],
      },
      {
        heading: '3. How we use information',
        blocks: [
          { type: 'p', text: 'We use personal information to:' },
          {
            type: 'ul',
            items: [
              'Provide, secure, and improve the Services, including performance and compatibility',
              'Authenticate you, manage your account, and send service-related communications',
              'Publish, distribute, and promote content consistent with our editorial and community standards',
              'Detect, prevent, and address fraud, abuse, security issues, and technical problems',
              'Comply with law, legal process, and regulatory obligations',
              'Exercise or defend legal claims',
              'Where allowed by law, send you updates about the Services; you can opt out of marketing where that choice is offered',
            ],
          },
          {
            type: 'p',
            text: '**Legal bases (EEA/UK):** We rely on performance of a contract, legitimate interests (such as improving security and user experience, balanced against your rights), and consent where required (e.g. non-essential cookies, where applicable). We process information as necessary to comply with legal obligations. Where we rely on consent, you may withdraw it at any time.',
          },
        ],
      },
      {
        heading: '4. How we share information',
        blocks: [
          {
            type: 'p',
            text: 'We do not sell your personal information. We may share it as follows:',
          },
          {
            type: 'ul',
            items: [
              '**Service providers** who help us host, operate, secure, and analyze the Services, subject to contracts that require appropriate safeguards',
              '**Professional advisors** (lawyers, auditors) when necessary under confidentiality obligations',
              '**Authorities** when we believe in good faith that disclosure is required by law, legal process, or to protect the rights, safety, or property of you, us, or others',
              '**Business transfers** in connection with a merger, acquisition, reorganization, or sale of assets, subject to appropriate protections',
              '**With your direction** (e.g. when you ask us to share content or integrate with a third party you choose)',
            ],
          },
        ],
      },
      {
        heading: '5. Cookies and similar technologies',
        blocks: [
          {
            type: 'p',
            text: 'We and our partners may use cookies, local storage, and similar technologies for essential functions, preferences, and, where you consent or as permitted by law, analytics. You can control cookies through your browser settings. Blocking certain cookies may affect functionality. Where required, we will obtain consent before using non-essential cookies.',
          },
        ],
      },
      {
        heading: '6. International transfers',
        blocks: [
          {
            type: 'p',
            text: 'We may process information in the United States and other countries. If we transfer personal information from the EEA, UK, or Switzerland to countries not deemed to provide an adequate level of protection, we will use appropriate safeguards such as the EU Standard Contractual Clauses or other lawful mechanisms, unless an exception applies.',
          },
        ],
      },
      {
        heading: '7. Retention',
        blocks: [
          {
            type: 'p',
            text: 'We keep personal information only as long as needed for the purposes described, unless a longer period is required or permitted by law. Criteria include the nature of the data, the risk of harm, and legal or business requirements (e.g. record retention for tax or litigation). When no longer needed, we delete, anonymize, or aggregate the information.',
          },
        ],
      },
      {
        heading: '8. Security',
        blocks: [
          {
            type: 'p',
            text: 'We implement appropriate technical and organizational measures designed to protect personal information. No system is completely secure. Please use strong, unique credentials and report suspected unauthorized access promptly.',
          },
        ],
      },
      {
        heading: '9. Children',
        blocks: [
          {
            type: 'p',
            text: 'The Services are not directed to children under 16 (or a higher age where required in your jurisdiction), and we do not knowingly collect their personal information. If you believe we have, contact us and we will take steps to delete the information, subject to law.',
          },
        ],
      },
      {
        heading: '10. Your rights and choices',
        blocks: [
          {
            type: 'p',
            text: 'Depending on your location, you may have the right to access, correct, delete, or export your personal information, restrict or object to certain processing, or withdraw consent where applicable. You may have the right to lodge a complaint with a supervisory authority. To exercise rights, contact us as described in Section 12.',
          },
          {
            type: 'p',
            text: '**EEA/UK:** You may have additional rights under the GDPR, including data portability and restriction of processing, where applicable to our processing activities.',
          },
          {
            type: 'p',
            text: '**California (CCPA/CPRA):** If you are a California resident, you have the right to know, delete, and correct personal information, and the right to opt out of "sale" or "sharing" for cross-context behavioral advertising, as those terms are defined. We do not "sell" personal information in the traditional sense, as described above. We do not knowingly sell or share personal information of consumers under 16 for those purposes. You may designate an authorized agent where permitted. We will not discriminate for exercising CCPA/CPRA rights. To exercise rights, contact us below; we will verify and respond in accordance with the law.',
          },
        ],
      },
      {
        heading: '11. Marketing communications',
        blocks: [
          {
            type: 'p',
            text: 'Where we send promotional emails, you can unsubscribe using the link in the email or by contacting us. We may still send important transactional or legal notices.',
          },
        ],
      },
      {
        heading: '12. Contact',
        blocks: [
          {
            type: 'p',
            text: 'For privacy requests or questions about this policy, contact us through [acta.build](https://acta.build). We will respond in line with applicable law, including timeframes required in your jurisdiction. You may also contact your local data protection authority if you have concerns we cannot resolve.',
          },
        ],
      },
      {
        heading: '13. Changes to this policy',
        blocks: [
          {
            type: 'p',
            text: 'We may update this Privacy Policy. We will post the new version on this page and change the "Last updated" date. If changes are material, we will provide additional notice as required by law.',
          },
        ],
      },
    ],
  },
};
