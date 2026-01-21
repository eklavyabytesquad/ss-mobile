import { Text, Linking, TouchableOpacity } from 'react-native';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

export function ExternalLink({ href, children, ...rest }) {
  const handlePress = async () => {
    if (process.env.EXPO_OS !== 'web') {
      // Open the link in an in-app browser.
      await openBrowserAsync(href, {
        presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
      });
    } else {
      Linking.openURL(href);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} {...rest}>
      {children}
    </TouchableOpacity>
  );
}
