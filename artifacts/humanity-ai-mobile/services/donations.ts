import { Linking } from "react-native";

/**
 * Donations are intentionally NOT processed in-app.
 *
 * Apple's App Review Guidelines (3.2.2 / 5.1) require nonprofit donations
 * to be collected outside of In-App Purchase — typically by sending the
 * donor to the organization's website in the system browser. This service
 * abstracts that hand-off so the rest of the app never hard-codes URLs.
 */
export const DONATION_URL = "https://humanityplusai.org/donate";

export const DonationService = {
  /** Opens the secure donation page on humanityplusai.org in the device browser. */
  async startDonation(): Promise<boolean> {
    try {
      await Linking.openURL(DONATION_URL);
      return true;
    } catch {
      return false;
    }
  },

  /** Membership checkout also lives on the website's donate page. */
  async startMembership(): Promise<boolean> {
    try {
      await Linking.openURL(DONATION_URL);
      return true;
    } catch {
      return false;
    }
  },
};
