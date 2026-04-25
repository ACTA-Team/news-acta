import { LegalDocPage } from '@/components/blocks';
import { LEGAL_LAST_UPDATED } from '@/config/legal';
import { siteConfig } from '@/config/site';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Privacy Policy',
  description:
    'How ACTA News collects, uses, and protects personal information when you use our website and services.',
  path: '/privacy',
});

export default function PrivacyPolicyPage() {
  return (
    <LegalDocPage title="Privacy Policy" lastUpdated={LEGAL_LAST_UPDATED}>
      <p>
        This Privacy Policy explains how ACTA (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
        &ldquo;our&rdquo;) processes personal information when you visit, use, or interact with{' '}
        {siteConfig.name} and related services (the &ldquo;Services&rdquo;), including at{' '}
        <a href={siteConfig.url} rel="noreferrer">
          {siteConfig.url.replace(/^https?:\/\//, '')}
        </a>
        . By using the Services, you agree to the practices described here. If you do not agree,
        please do not use the Services.
      </p>
      <p>
        We process personal information in accordance with applicable data protection laws. Depending
        on your location, you may have specific rights, which are summarized below.
      </p>

      <h2>1. Who we are</h2>
      <p>
        ACTA operates the Services in connection with its ecosystem of products and public
        communications. For the purposes of the EU/UK General Data Protection Regulation
        (&ldquo;GDPR&rdquo;), ACTA is typically the data controller of personal information we
        determine the purposes and means of processing for the Services, unless a separate
        agreement states otherwise. Contact details: see Section 10.
      </p>

      <h2>2. Information we collect</h2>
      <h3>2.1 You provide to us</h3>
      <ul>
        <li>Account and authentication data, such as email address, name, and sign-in method</li>
        <li>
          Content you send us (e.g. editorial submissions, feedback, or support messages) and
          related metadata
        </li>
        <li>Preferences you set (e.g. display or communication preferences) where we offer them</li>
      </ul>
      <h3>2.2 Collected automatically</h3>
      <ul>
        <li>Device and log data, such as IP address, browser type, operating system, and timestamps</li>
        <li>
          Usage data, such as pages viewed, links clicked, referring URLs, and general interaction
          patterns
        </li>
        <li>
          Cookies and similar technologies (see Section 5), including information needed for
          security, session continuity, and analytics where enabled
        </li>
      </ul>
      <h3>2.3 From third parties</h3>
      <p>
        If you use social or single sign-on providers, we may receive a limited set of data from
        those providers as permitted by your settings and their policies (for example, profile
        identifiers and email). We may also receive aggregated or business contact information
        from partners where lawful.
      </p>

      <h2>3. How we use information</h2>
      <p>We use personal information to:</p>
      <ul>
        <li>Provide, secure, and improve the Services, including performance and compatibility</li>
        <li>Authenticate you, manage your account, and send service-related communications</li>
        <li>Publish, distribute, and promote content consistent with our editorial and community
          standards
        </li>
        <li>Detect, prevent, and address fraud, abuse, security issues, and technical problems</li>
        <li>Comply with law, legal process, and regulatory obligations</li>
        <li>Exercise or defend legal claims</li>
        <li>Where allowed by law, send you updates about the Services; you can opt out of marketing
          where that choice is offered
        </li>
      </ul>
      <p>
        <strong>Legal bases (EEA/UK):</strong> We rely on performance of a contract, legitimate
        interests (such as improving security and user experience, balanced against your rights),
        and consent where required (e.g. non-essential cookies, where applicable). We process
        information as necessary to comply with legal obligations. Where we rely on consent, you
        may withdraw it at any time.
      </p>

      <h2>4. How we share information</h2>
      <p>We do not sell your personal information. We may share it as follows:</p>
      <ul>
        <li>
          <strong>Service providers</strong> who help us host, operate, secure, and analyze the
          Services, subject to contracts that require appropriate safeguards
        </li>
        <li>
          <strong>Professional advisors</strong> (lawyers, auditors) when necessary under
          confidentiality obligations
        </li>
        <li>
          <strong>Authorities</strong> when we believe in good faith that disclosure is required by
          law, legal process, or to protect the rights, safety, or property of you, us, or others
        </li>
        <li>
          <strong>Business transfers</strong> in connection with a merger, acquisition,
          reorganization, or sale of assets, subject to appropriate protections
        </li>
        <li>
          <strong>With your direction</strong> (e.g. when you ask us to share content or integrate
          with a third party you choose)
        </li>
      </ul>

      <h2>5. Cookies and similar technologies</h2>
      <p>
        We and our partners may use cookies, local storage, and similar technologies for essential
        functions, preferences, and—where you consent or as permitted by law—analytics. You can
        control cookies through your browser settings. Blocking certain cookies may affect
        functionality. Where required, we will obtain consent before using non-essential cookies.
      </p>

      <h2>6. International transfers</h2>
      <p>
        We may process information in the United States and other countries. If we transfer personal
        information from the EEA, UK, or Switzerland to countries not deemed to provide an adequate
        level of protection, we will use appropriate safeguards such as the EU Standard Contractual
        Clauses or other lawful mechanisms, unless an exception applies.
      </p>

      <h2>7. Retention</h2>
      <p>
        We keep personal information only as long as needed for the purposes described, unless a
        longer period is required or permitted by law. Criteria include the nature of the data, the
        risk of harm, and legal or business requirements (e.g. record retention for tax or
        litigation). When no longer needed, we delete, anonymize, or aggregate the information.
      </p>

      <h2>8. Security</h2>
      <p>
        We implement appropriate technical and organizational measures designed to protect personal
        information. No system is completely secure. Please use strong, unique credentials and
        report suspected unauthorized access promptly.
      </p>

      <h2>9. Children</h2>
      <p>
        The Services are not directed to children under 16 (or a higher age where required in your
        jurisdiction), and we do not knowingly collect their personal information. If you believe we
        have, contact us and we will take steps to delete the information, subject to law.
      </p>

      <h2>10. Your rights and choices</h2>
      <p>
        Depending on your location, you may have the right to access, correct, delete, or export
        your personal information, restrict or object to certain processing, or withdraw consent
        where applicable. You may have the right to lodge a complaint with a supervisory
        authority. To exercise rights, contact us as described in Section 12.
      </p>
      <p>
        <strong>EEA/UK:</strong> You may have additional rights under the GDPR, including
        data portability and restriction of processing, where applicable to our processing
        activities.
      </p>
      <p>
        <strong>California (CCPA/CPRA):</strong> If you are a California resident, you have the
        right to know, delete, and correct personal information, and the right to opt out of
        &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; for cross-context behavioral advertising, as
        those terms are defined. We do not &ldquo;sell&rdquo; personal information in the
        traditional sense, as described above. We do not knowingly sell or share personal
        information of consumers under 16 for those purposes. You may designate an authorized
        agent where permitted. We will not discriminate for exercising CCPA/CPRA rights. To
        exercise rights, contact us below; we will verify and respond in accordance with the law.
      </p>
      <p>
        <strong>Other U.S. states:</strong> Similar rights may apply under state privacy laws in
        Colorado, Virginia, and other states as they take effect. Contact us to exercise
        applicable rights.
      </p>

      <h2>11. Marketing communications</h2>
      <p>
        Where we send promotional emails, you can unsubscribe using the link in the email or by
        contacting us. We may still send important transactional or legal notices.
      </p>

      <h2>12. Contact</h2>
      <p>
        For privacy requests or questions about this policy, contact us through{' '}
        <a href="https://acta.build" rel="noreferrer" target="_blank">
          acta.build
        </a>
        . We will respond in line with applicable law, including timeframes required in your
        jurisdiction. You may also contact your local data protection authority if you have
        concerns we cannot resolve.
      </p>

      <h2>13. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy. We will post the new version on this page and change the
        &ldquo;Last updated&rdquo; date. If changes are material, we will provide additional notice
        as required by law.
      </p>
    </LegalDocPage>
  );
}
