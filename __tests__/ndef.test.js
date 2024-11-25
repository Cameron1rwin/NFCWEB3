import { expect, test } from '@jest/globals';
import { Ndef } from 'react-native-nfc-manager'; 

const testData = {
    ndefMessage: [
        {
            payload: [4, 114, 101, 97, 99, 116, 110, 97, 116, 105, 118, 101, 46, 100, 101, 118],
            type: [85],
            id: [],
            tnf: 1,
        },
    ],

};

test('ndef', () => {
    const decodeed = Ndef.decodeMessage(testData.ndefMessage[0].payload);
    expect(decodeed).toEqual('reactnative.dev');
});