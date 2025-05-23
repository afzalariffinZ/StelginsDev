import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TermsOfServiceProps {
  t: (key: string, options?: { defaultValue: string }) => string;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ t }) => {
  return (
    <View>
      <Text style={styles.heading}>{t('tos_main_title', { defaultValue: "Terms of Service" })}</Text>

      <Text style={[styles.paragraph, { fontStyle: 'italic', marginBottom: 5 }]}>
        {t('tos_effective_date', { defaultValue: "Effective Date: 10 May 2025" })}
      </Text>
      <Text style={[styles.paragraph, { fontStyle: 'italic', marginBottom: 20 }]}>
        {t('tos_last_updated', { defaultValue: "Last Updated: 20 May 2025" })}
      </Text>

      <Text style={styles.paragraph}>
        {t('tos_welcome', { defaultValue: "Welcome to Stelggin! Thank you for choosing our mobile application (\"App\") — designed to help you track your diet, physical activity, and overall well-being. This Terms of Service agreement (\"Terms\") outlines your rights and responsibilities when using our App and services." })}
      </Text>
      <Text style={styles.paragraph}>
        {t('tos_agreement', { defaultValue: "By downloading, installing, accessing, or using the App, you agree to be bound by these Terms. If you do not agree, please do not use the App." })}
      </Text>

      <Text style={styles.sectionTitle}>{t('tos_section1_title', { defaultValue: "1. Eligibility and Account Registration" })}</Text>
      <Text style={styles.paragraph}>
        {t('tos_section1_intro', { defaultValue: "To use the App, you must be:" })}
      </Text>
      <Text style={styles.listItem}>- {t('tos_section1_item1', { defaultValue: "At least 18 years old, or;" })}</Text>
      <Text style={styles.listItem}>- {t('tos_section1_item2', { defaultValue: "If under 18, have permission from a parent or legal guardian." })}</Text>
      <Text style={styles.paragraph}>
        {t('tos_section1_info_accuracy', { defaultValue: "You agree to provide accurate, current, and complete information during registration and to keep your information updated. You are solely responsible for all activities that occur under your account and for safeguarding your login credentials." })}
      </Text>

      <Text style={styles.sectionTitle}>{t('tos_section2_title', { defaultValue: "2. Health & Medical Disclaimer" })}</Text>
      <Text style={styles.paragraph}>
        {t('tos_section2_purpose', { defaultValue: "The App is intended to help users monitor general health-related data such as diet, exercise, and activity levels. However, Stelggin does not offer medical advice, diagnoses, or treatment." })}
      </Text>
      <Text style={styles.paragraph}>
        {t('tos_section2_disclaimer', { defaultValue: "All content, data, and suggestions in the App are for informational purposes only and are not intended as a substitute for professional medical advice. Always consult with a licensed healthcare provider before making changes to your health regimen." })}
      </Text>

      <Text style={styles.sectionTitle}>{t('tos_section3_title', { defaultValue: "3. Permitted Use and Restrictions" })}</Text>
      <Text style={styles.paragraph}>
        {t('tos_section3_intro', { defaultValue: "You may use the App only for lawful and personal purposes. You agree not to:" })}
      </Text>
      <Text style={styles.listItem}>- {t('tos_section3_item1', { defaultValue: "Upload false, harmful, or misleading information." })}</Text>
      <Text style={styles.listItem}>- {t('tos_section3_item2', { defaultValue: "Use the App for illegal or unauthorized purposes." })}</Text>
      <Text style={styles.listItem}>- {t('tos_section3_item3', { defaultValue: "Interfere with the operation or security of the App." })}</Text>
      <Text style={styles.listItem}>- {t('tos_section3_item4', { defaultValue: "Attempt to access other users' accounts or data." })}</Text>
      <Text style={styles.listItem}>- {t('tos_section3_item5', { defaultValue: "Reverse-engineer, decompile, or modify any part of the App." })}</Text>
      <Text style={styles.paragraph}>
        {t('tos_section3_termination_right', { defaultValue: "We reserve the right to suspend or terminate your access for any misuse or breach of these Terms." })}
      </Text>

      <Text style={styles.sectionTitle}>{t('tos_section4_title', { defaultValue: "4. User-Generated Content" })}</Text>
      <Text style={styles.paragraph}>
        {t('tos_section4_license', { defaultValue: "By submitting health logs, entries, or any other content, you grant Stelggin a worldwide, non-exclusive, royalty-free license to use, store, analyze, and process that data solely for the purpose of providing and improving the App and its services." })}
      </Text>
      <Text style={styles.paragraph}>
        {t('tos_section4_representation', { defaultValue: "You represent that you have the right to submit such data and that it does not violate any third-party rights." })}
      </Text>

      <Text style={styles.sectionTitle}>{t('tos_section6_title', { defaultValue: "6. Intellectual Property" })}</Text>
      <Text style={styles.paragraph}>
        {t('tos_section6_content', { defaultValue: "All materials within the App, including text, graphics, logos, UI design, and software, are the exclusive property of Stelggin or its licensors. You may not copy, distribute, or exploit any part of the App without written permission." })}
      </Text>

      <Text style={styles.sectionTitle}>{t('tos_section7_title', { defaultValue: "7. Availability and Modifications" })}</Text>
      <Text style={styles.paragraph}>
        {t('tos_section7_content', { defaultValue: "Stelggin aims to provide uninterrupted access to the App, but we do not guarantee continuous availability. The App may be updated or changed at any time to improve performance or comply with legal requirements. Users will be notified of significant changes." })}
      </Text>

      <Text style={styles.sectionTitle}>{t('tos_section8_title', { defaultValue: "8. Account Suspension or Termination" })}</Text>
      <Text style={styles.paragraph}>
        {t('tos_section8_intro', { defaultValue: "Stelggin reserves the right to suspend or permanently terminate your account if you:" })}
      </Text>
      <Text style={styles.listItem}>- {t('tos_section8_item1', { defaultValue: "Violate these Terms or applicable laws." })}</Text>
      <Text style={styles.listItem}>- {t('tos_section8_item2', { defaultValue: "Submit fraudulent or misleading data." })}</Text>
      <Text style={styles.listItem}>- {t('tos_section8_item3', { defaultValue: "Engage in behavior harmful to the App, other users, or our systems." })}</Text>
      <Text style={styles.paragraph}>
        {t('tos_section8_consequences', { defaultValue: "Upon termination, all licenses granted to you will immediately be revoked. You may request data deletion by contacting us." })}
      </Text>

      <Text style={styles.sectionTitle}>{t('tos_section9_title', { defaultValue: "9. Limitation of Liability" })}</Text>
      <Text style={styles.paragraph}>
        {t('tos_section9_intro', { defaultValue: "To the fullest extent permitted by law, Stelggin is not liable for:" })}
      </Text>
      <Text style={styles.listItem}>- {t('tos_section9_item1', { defaultValue: "Any direct or indirect damages arising from your use of the App." })}</Text>
      <Text style={styles.listItem}>- {t('tos_section9_item2', { defaultValue: "Decisions made based on the App's suggestions." })}</Text>
      <Text style={styles.listItem}>- {t('tos_section9_item3', { defaultValue: "Health consequences resulting from inaccurate data entries." })}</Text>
      <Text style={styles.paragraph}>
        {t('tos_section9_risk', { defaultValue: "Use of the App is at your own risk. We provide the App on an \"as is\" and \"as available\" basis without warranties of any kind." })}
      </Text>

      <Text style={styles.sectionTitle}>{t('tos_section10_title', { defaultValue: "10. Governing Law and Dispute Resolution" })}</Text>
      <Text style={styles.paragraph}>
        {t('tos_section10_content', { defaultValue: "These Terms are governed by the laws of Malaysia, without regard to its conflict of law rules. Any disputes shall be subject to the exclusive jurisdiction of the courts in Malaysia." })}
      </Text>

      <Text style={styles.sectionTitle}>{t('tos_section11_title', { defaultValue: "11. Changes to Terms" })}</Text>
      <Text style={styles.paragraph}>
        {t('tos_section11_content', { defaultValue: "We may revise these Terms from time to time. If we do, we'll post the updated version in the App and notify you via email or push notification. Continued use of the App after updates constitutes your acceptance of the new Terms." })}
      </Text>

      <Text style={styles.sectionTitle}>{t('tos_section12_title', { defaultValue: "12. Contact Us" })}</Text>
      <Text style={styles.paragraph}>
        {t('tos_section12_intro', { defaultValue: "For questions about these Terms, your personal data, or anything else, contact us:" })}
      </Text>
      <Text style={styles.listItem}>📧 {t('tos_contact_support_email', { defaultValue: "support@stelggin.com" })}</Text>
      <Text style={styles.listItem}>📧 {t('tos_contact_privacy_email', { defaultValue: "privacy@stelggin.com" })}</Text>
      <Text style={styles.listItem}>🏢 {t('tos_contact_address', { defaultValue: "[Stelggin Company Address]" })}</Text>
      <Text style={styles.listItem}>📞 {t('tos_contact_phone', { defaultValue: "[Stelggin Customer Support Number]" })}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 15,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2d3748',
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: '#4a5568',
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'justify',
  },
  listItem: {
    fontSize: 15,
    color: '#4a5568',
    lineHeight: 22,
    marginBottom: 6,
    marginLeft: 10,
  },
});

export default TermsOfService; 