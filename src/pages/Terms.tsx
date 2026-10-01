import { Link } from "react-router-dom";
import LegalPage from "@/components/LegalPage";

export default function Terms() {
  return (
    <LegalPage title="Pulse Journal Terms of Use">
      <h2>Not a medical device</h2>
      <p>
        Pulse Journal is a personal wellness tool. It is not a medical device and does not diagnose, treat, cure, or
        prevent any disease. Suggestions, summaries, and specialist recommendations are for information only and do not
        replace advice from a qualified clinician. <strong>In an emergency, call 911 or your local emergency number.</strong>
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must be 18 or older.</li>
        <li>Keep your sign-in details private. You're responsible for activity on your account.</li>
        <li>Use the app for your own health information, or for someone you're legally allowed to act for.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        You own what you enter. You allow us to store and process it only to provide Pulse Journal to you. You can export
        or delete it at any time.
      </p>

      <h2>Third-party information</h2>
      <p>
        Specialist listings, ratings, insurance details, and reference links come from public sources and may be
        incomplete or out of date. Always confirm with the provider and your insurer.
      </p>

      <h2>Imported records</h2>
      <p>
        When you connect a patient portal, you authorize Pulse Journal to read your records on your behalf. The import is
        read-only. Your provider's record remains the official one.
      </p>

      <h2>Limits</h2>
      <p>
        The app is provided "as is." To the extent the law allows, SuprimaLabs is not liable for decisions made based on
        the app's content.
      </p>

      <h2>Changes</h2>
      <p>We'll let you know in the app before material changes to these terms take effect.</p>

      <h2>Contact</h2>
      <p>Use our <Link className="text-primary hover:underline" to="/#contact">contact form</Link>.</p>
    </LegalPage>
  );
}
