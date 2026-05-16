import React from 'react';
import { Pressable, StyleSheet, Linking } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { colors } from '../constants/theme';

export function WhatsAppFab({ phoneE164 }) {
  const onPress = () => {
    const num = (phoneE164 || '').replace(/\D/g, '');
    if (!num) return;
    Linking.openURL(`https://wa.me/${num}`);
  };
  return (
    <Pressable style={styles.fab} onPress={onPress}>
      <MessageCircle color="#fff" size={26} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 88,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
