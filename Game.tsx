// Game.tsx

import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import AndroidPrompt from './AndroidPrompt';

function Game(): React.JSX.Element {
    const [isWriting, setIsWriting] = useState(false);
    const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
    const [writeUrl, setWriteUrl] = useState<string>('https://example.com');
    const androidPromptRef = useRef<any>();

    // Handle URL changes from the input
    const handleUrlChange = (url: string) => {
        const sanitizedUrl = url.startsWith("https://") ? url : `https://${url}`;
        // Temporarily store the new URL without updating writeUrl immediately
        androidPromptRef.current?.setNewInputUrl(sanitizedUrl);
    };

    // Update writeUrl when "Update" is pressed
    const updateWriteUrl = (newUrl: string) => {
        setWriteUrl(newUrl);
    };

    // Function to initiate the write operation after updating the URL
    const initiateWriteOperation = () => {
        writeUrlToTag(); // Start the write process with the updated URL
    };

    // Read URL from NFC Tag
    const readUrlFromTag = async () => {
        try {
            setIsWriting(false); // Ensure we're in read mode
            await NfcManager.cancelTechnologyRequest().catch(() => 0);
            androidPromptRef.current?.setVisible(true);

            const techRequestSuccess = await NfcManager.requestTechnology(NfcTech.Ndef).catch(() => false);
            if (!techRequestSuccess) {
                Alert.alert("Error", "Failed to initiate NFC tech request. Please try again.");
                return;
            }

            const tag = await NfcManager.getTag();
            if (tag && tag.ndefMessage) {
                const ndefRecord = tag.ndefMessage[0];
                if (
                    ndefRecord &&
                    ndefRecord.tnf === Ndef.TNF_WELL_KNOWN &&
                    Ndef.isType(ndefRecord, Ndef.TNF_WELL_KNOWN, Ndef.RTD_URI)
                ) {
                    const uri = Ndef.uri.decodePayload(Uint8Array.from(ndefRecord.payload));
                    setDetectedUrl(uri);
                } else {
                    Alert.alert("No URL found on this tag.");
                }
            } else {
                Alert.alert("Unsupported or empty NFC tag.");
            }
        } catch (error) {
            console.warn("Error reading NFC tag:", error);
        } finally {
            await NfcManager.cancelTechnologyRequest();
            androidPromptRef.current?.setVisible(false); // Close the prompt after reading
        }
    };

    // Write URL to NFC Tag using the updated writeUrl
    const writeUrlToTag = async () => {
        try {
          await NfcManager.cancelTechnologyRequest().catch(() => 0); // Reset NFC state
          androidPromptRef.current?.setVisible(true); // Keep prompt visible
      
          // Retry mechanism for NFC technology request
          let techRequestSuccess = false;
          for (let attempt = 0; attempt < 3; attempt++) {
            techRequestSuccess = Boolean(await NfcManager.requestTechnology(NfcTech.Ndef).catch(() => false));
            if (techRequestSuccess) break;
          }
          if (!techRequestSuccess) {
            Alert.alert("Error", "Failed to initiate NFC tech request. Please try again.");
            setIsWriting(false);
            return;
          }
      
          // Encode and write the URL
          const sanitizedUrl = writeUrl.startsWith("https://") ? writeUrl : `https://${writeUrl}`;
          const bytes = Ndef.encodeMessage([Ndef.uriRecord(sanitizedUrl)]);
          if (bytes) {
            await NfcManager.ndefHandler.writeNdefMessage(bytes);
            Alert.alert("Success", `URL ${sanitizedUrl} written to NFC tag!`);
          } else {
            Alert.alert("Failed to encode URL for NFC tag.");
          }
        } catch (error) {
          console.warn("Error writing to NFC tag:", error);
          Alert.alert("Write Error", "An error occurred while writing to the NFC tag.");
        } finally {
          await NfcManager.cancelTechnologyRequest();
        }
      };

    return (
        <View style={styles.wrapper}>
            <Text style={styles.title}>NFC Functionality</Text>
            <TouchableOpacity style={styles.button} onPress={readUrlFromTag}>
                <Text style={styles.buttonText}>Read URL from NFC Tag</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => {
                setIsWriting(true);
                androidPromptRef.current?.setVisible(true);
            }} disabled={isWriting}>
                <Text style={styles.buttonText}>Write URL to NFC Tag</Text>
            </TouchableOpacity>
            <AndroidPrompt
                ref={androidPromptRef}
                hintText={isWriting ? `Writing URL: ${writeUrl}` : `NFC Tag URL Detected: ${detectedUrl || "No URL detected"}`}
                url={isWriting ? writeUrl : detectedUrl || ""}
                isWritingMode={isWriting}
                onUrlChange={handleUrlChange}
                onUpdatePress={updateWriteUrl} // Pass the update function
                onReadyToWrite={initiateWriteOperation} // Notify to start writing after update
                onCancelPress={() => {
                    setIsWriting(false); // Set writing mode to false on cancel
                    NfcManager.unregisterTagEvent().catch(() => 0);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
    button: {
        alignItems: 'center',
        backgroundColor: '#DDDDDD',
        padding: 10,
        marginVertical: 5,
        borderRadius: 8,
        width: '80%',
    },
    buttonText: {
        fontSize: 18,
    },
});

export default Game;
