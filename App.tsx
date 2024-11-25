import React, { useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PanResponder,
  Animated,
} from 'react-native';
import NfcManager from 'react-native-nfc-manager';
import Game from './Game';
import '@walletconnect/react-native-compat';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, arbitrum } from '@wagmi/core/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit, defaultWagmiConfig, AppKit, AppKitButton, NetworkButton } from '@reown/appkit-wagmi-react-native';


const queryClient = new QueryClient();

const projectId = '62c8eaca39c29a52da1d714e6bb1df02';
const metadata = {
  name: 'Web3NFC RN',
  description: 'WEB3 NFC TEST APP',
  url: 'https://reown.com/appkit',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
  redirect: {
    native: 'YOUR_APP_SCHEME://',
    universal: 'YOUR_APP_UNIVERSAL_LINK.com',
  },
};
const chains = [mainnet, polygon, arbitrum] as const;
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

createAppKit({
  projectId,
  wagmiConfig,
  defaultChain: mainnet,
});

function NFCHandler({ children }: React.PropsWithChildren<{}>): React.JSX.Element {
  const [hasNfc, setHasNfc] = React.useState<boolean | null>(null);
  const [enabled, setEnabled] = React.useState<boolean>(false);

  React.useEffect(() => {
    async function checkNfc() {
      const supported = await NfcManager.isSupported();
      if (supported) {
        await NfcManager.start();
        setEnabled(await NfcManager.isEnabled());
      }
      setHasNfc(supported);
    }
    checkNfc();
  }, []);

  if (hasNfc === null) {
    return <></>;
  } else if (!hasNfc) {
    return (
      <View style={styles.wrapper}>
        <Text>Device doesn't support NFC</Text>
      </View>
    );
  } else if (!enabled) {
    return (
      <View style={styles.wrapper}>
        <Text>Your NFC is not enabled</Text>
        <TouchableOpacity
          onPress={() => {
            NfcManager.goToNfcSetting();
          }}
        >
          <Text>Go to settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            setEnabled(await NfcManager.isEnabled());
          }}
        >
          <Text>Check again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

function App(): React.JSX.Element {
  // State to track the last position
  const [lastPosition, setLastPosition] = useState({ x: 20, y: 20 });

  // Ref for the Animated.ValueXY
  const pan = useRef(new Animated.ValueXY(lastPosition)).current;

  const panResponder = useRef(
    PanResponder.create({
      // Allow dragging only if the touch target is not a button
      onStartShouldSetPanResponder: (evt, gestureState) => {
        const targetNodeID = evt.nativeEvent.target;

        // Check if the target is undefined or not a valid draggable area
        if (!targetNodeID) {
          console.log('Undefined target or no valid interaction area');
          return true; // Default to allowing dragging
        }
  
        // Add additional checks for buttons or other non-draggable areas if needed
        return true; // Allow dragging
      },
      onPanResponderMove: (_, gestureState) => {
        // Update the Animated Value based on gesture movement
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        // Calculate the new position
        const newX = lastPosition.x + gestureState.dx;
        const newY = lastPosition.y + gestureState.dy;

        // Update the state to save the new position
        setLastPosition({ x: newX, y: newY });

        // Set the final position for the Animated Value
        pan.setOffset({ x: newX, y: newY });
        pan.setValue({ x: 0, y: 0 }); // Reset delta to avoid accumulation
      },
    })
  ).current;

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaView style={styles.container}>
          <NFCHandler>
            <Game />
          </NFCHandler>
          <AppKit />
          {/* Draggable Wallet Connection Buttons */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.fixedButtonContainer,
              {
                transform: pan.getTranslateTransform(),
              },
            ]}
          >
            <View testID="appKitButton">
            <AppKitButton  />
            <View style={styles.buttonSpacing}>
              <NetworkButton />
            </View>
            </View>
          </Animated.View>
        </SafeAreaView>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 20, // Adjust for vertical position
    right: 20, // Adjust for horizontal position
    flexDirection: 'row', // Align buttons side-by-side
    alignItems: 'center', // Center buttons vertically
    backgroundColor: 'white', // Optional background
    padding: 10,
    borderRadius: 10, // Rounded edges for the container
    elevation: 5, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonSpacing: {
    marginLeft: 10, // Space between buttons
  },
});

export default App;
