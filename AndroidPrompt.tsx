// AndroidPrompt.tsx

import React, { forwardRef, useState, useRef, useImperativeHandle } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, Animated } from 'react-native';

interface AndroidPromptProps {
  onCancelPress: () => void;
  hintText?: string;
  url?: string;
  isWritingMode?: boolean;
  onUrlChange?: (url: string) => void;
  onUpdatePress?: (newUrl: string) => void; // Accepts newUrl
  onReadyToWrite?: () => void; // Notify when ready to write
}

const AndroidPrompt = forwardRef<{}, AndroidPromptProps>(({
  onCancelPress,
  hintText,
  url,
  isWritingMode,
  onUrlChange,
  onUpdatePress,
  onReadyToWrite,
}, ref) => {
  const [visible, setVisible] = useState(false);
  const [inputUrl, setInputUrl] = useState(url || '');
  const animValue = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    setVisible: (isVisible: boolean) => {
      setVisible(isVisible);
      if (isVisible) {
        Animated.timing(animValue, { duration: 300, toValue: 1, useNativeDriver: true }).start();
      } else {
        Animated.timing(animValue, { duration: 300, toValue: 0, useNativeDriver: true }).start();
      }
    },
    setNewInputUrl: (newUrl: string) => {
      setInputUrl(newUrl);
    },
  }));

  const backdropAnimStyle = { opacity: animValue };
  const promptAnimStyle = {
    transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }],
  };

  // Handle Update button press
  const handleUpdate = () => {
    const sanitizedUrl = inputUrl.startsWith("https://") ? inputUrl : `https://${inputUrl}`;
    if (onUpdatePress) {
      onUpdatePress(sanitizedUrl); // Update writeUrl in Game.tsx
    }
    // Notify that the URL is updated and ready to write
    if (onReadyToWrite) {
      onReadyToWrite();
    }
    // Do NOT close the modal; keep it open waiting for NFC tag
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropAnimStyle]} />
        <Animated.View style={[styles.prompt, promptAnimStyle]}>
          <Text style={styles.hint}>{hintText || "NFC Prompt"}</Text>

          <Text style={styles.urlText}>
            {!isWritingMode ? url || "No URL detected yet" : "Current URL to Write:"}
          </Text>

          {isWritingMode && (
            <TextInput
              style={styles.input}
              placeholder="Enter URL to write"
              value={inputUrl}
              onChangeText={(text) => {
                const sanitizedUrl = text.startsWith("https://") ? text : `https://${text}`;
                setInputUrl(sanitizedUrl);
                if (onUrlChange) onUrlChange(sanitizedUrl);
              }}
            />
          )}

          <View style={styles.buttonContainer}>
            {isWritingMode && onUpdatePress && (
              <TouchableOpacity
                style={[styles.button, styles.updateButton]}
                onPress={handleUpdate}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setVisible(false);
                onCancelPress();
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    ...StyleSheet.absoluteFillObject,
  },
  prompt: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  hint: {
    fontSize: 18,
    marginBottom: 10,
  },
  urlText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  updateButton: {
    backgroundColor: '#4CAF50', // Green for Update
  },
  cancelButton: {
    backgroundColor: '#F44336', // Red for Cancel
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AndroidPrompt;
 