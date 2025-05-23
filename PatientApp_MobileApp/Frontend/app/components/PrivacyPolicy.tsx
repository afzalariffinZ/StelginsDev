import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PrivacyPolicyProps {
  t: (key: string, options?: { defaultValue: string }) => string;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ t }) => {
  return (
    <View>
      <Text style={styles.heading}>{t('privacy_main_title', { defaultValue: "Privacy Policy" })}</Text>

      <Text style={styles.paragraph}>
        {t('privacy_intro_pdpa', { defaultValue: "We take your privacy seriously and comply with the Personal Data Protection Act 2010 (PDPA) of Malaysia." })}
      </Text>

      <Text style={styles.sectionTitle}>{t('privacy_collect_title', { defaultValue: "What We Collect:" })}</Text>
      <Text style={styles.listItem}>- {t('privacy_collect_item_personal', { defaultValue: "Personal data: Name, age, gender, email address." })}</Text>
      <Text style={styles.listItem}>- {t('privacy_collect_item_health', { defaultValue: "Health data: Diet logs, physical activity, weight, fitness goals." })}</Text>
      <Text style={styles.listItem}>- {t('privacy_collect_item_technical', { defaultValue: "Technical data: Device information, app usage patterns, IP address." })}</Text>

      <Text style={styles.sectionTitle}>{t('privacy_why_collect_title', { defaultValue: "Why We Collect It:" })}</Text>
      <Text style={styles.listItem}>- {t('privacy_why_collect_item_personalize', { defaultValue: "To provide personalized recommendations and feedback." })}</Text>
      <Text style={styles.listItem}>- {t('privacy_why_collect_item_improve', { defaultValue: "To improve our App's features and user experience." })}</Text>
      <Text style={styles.listItem}>- {t('privacy_why_collect_item_support', { defaultValue: "To respond to user inquiries or technical support requests." })}</Text>
      <Text style={styles.listItem}>- {t('privacy_why_collect_item_legal', { defaultValue: "To fulfill legal and regulatory obligations." })}</Text>

      <Text style={styles.sectionTitle}>{t('privacy_store_protect_title', { defaultValue: "How We Store and Protect Your Data:" })}</Text>
      <Text style={styles.listItem}>- {t('privacy_store_protect_item_servers', { defaultValue: "Data is securely stored in encrypted servers within compliant data centers." })}</Text>
      <Text style={styles.listItem}>- {t('privacy_store_protect_item_access', { defaultValue: "Access to your data is restricted to authorized personnel only." })}</Text>
      <Text style={styles.listItem}>- {t('privacy_store_protect_item_safeguards', { defaultValue: "We implement physical, administrative, and technical safeguards to prevent unauthorized access, use, or disclosure." })}</Text>

      <Text style={styles.sectionTitle}>{t('privacy_share_title', { defaultValue: "Who We Share It With:" })}</Text>
      <Text style={styles.listItem}>- {t('privacy_share_item_providers', { defaultValue: "Only with third-party service providers (e.g., cloud hosting, analytics) under strict confidentiality agreements." })}</Text>
      <Text style={styles.listItem}>- {t('privacy_share_item_law', { defaultValue: "With law enforcement or regulators, if required by law." })}</Text>
      <Text style={styles.listItem}>- {t('privacy_share_item_anonymized', { defaultValue: "We may share anonymized data with research institutions or analytics providers." })}</Text>
      <Text style={styles.paragraph}>
        {t('privacy_share_no_sell', { defaultValue: "We do not sell, rent, or trade your personal data." })}
      </Text>
      <Text style={styles.listItem}>- {t('privacy_share_item_sell', { defaultValue: "We do not sell, rent, or trade your personal data. We only sell necessary data anonymously (e.g., diet log, activity log, diet progress)  to trusted research institutes for diet related research purposes." })}</Text>

      <Text style={styles.sectionTitle}>{t('privacy_pdpa_rights_title', { defaultValue: "Your PDPA Rights:" })}</Text>
      <Text style={styles.paragraph}>
        {t('privacy_pdpa_rights_intro', { defaultValue: "Under PDPA, you have the right to:" })}
      </Text>
      <Text style={styles.listItem}>- {t('privacy_pdpa_rights_item_access', { defaultValue: "Access your personal data and request corrections." })}</Text>
      <Text style={styles.listItem}>- {t('privacy_pdpa_rights_item_withdraw', { defaultValue: "Withdraw consent for data processing (with reasonable notice)." })}</Text>
      <Text style={styles.listItem}>- {t('privacy_pdpa_rights_item_delete', { defaultValue: "Request deletion of your data." })}</Text>
      <Text style={styles.paragraph}>
        {t('privacy_pdpa_rights_contact', { defaultValue: "To exercise these rights, email us at privacy@stelggin.com." })}
      </Text>

      <Text style={styles.sectionTitle}>{t('privacy_contact_us_title', { defaultValue: "Contact Us About Privacy" })}</Text>
      <Text style={styles.paragraph}>
        {t('privacy_contact_us_text', { defaultValue: "If you have any questions about this Privacy Policy or our privacy practices, please contact us at:" })}
      </Text>
      <Text style={styles.listItem}>📧 {t('privacy_contact_email_value', { defaultValue: "privacy@stelggin.com" })}</Text>
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

export default PrivacyPolicy; 