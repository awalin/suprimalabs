import { Link } from "react-router-dom";
import LegalPage from "@/components/LegalPage";

const contact = <Link className="text-primary hover:underline" to="/#contact">contact form</Link>;

export default function Privacy() {
  return (
    <LegalPage title="SuprimaLabs Privacy Policy">
      <p>
        This policy covers the SuprimaLabs website and our Pulse Journal app (web and Android). Pulse Journal is a personal
        wellness journal you use directly; it is not operated on behalf of a doctor, hospital or insurer. You decide what goes
        in it, and you can export or delete it at any time.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Account:</strong> your email address, display name and sign-in details.</li>
        <li><strong>Health information you enter:</strong> journal entries, symptoms, moods, medications, vitals, cycle, pregnancy and sexual-health notes, family history, age and other details you choose to add.</li>
        <li><strong>Records you import:</strong> medications, visits and lab results from a patient portal you sign in to. Imports are read-only.</li>
        <li><strong>Contact form:</strong> the name, email and message you send us from the website.</li>
        <li><strong>Basic technical data:</strong> browser or device type and error logs needed to keep the service working. We do not use advertising trackers.</li>
      </ul>

      <h2>2. Health data</h2>
      <ul>
        <li>Health data is used only to run your journal: timeline, insights, reminders, visit-prep briefs and weekly summaries.</li>
        <li>AI features send the relevant text to our AI provider only to produce your result. It is not used for advertising or to train advertising models.</li>
        <li>We collect health data only after you give explicit consent in the app, and you can withdraw it by deleting your account.</li>
        <li>We never sell health data, never share it with advertisers or data brokers, and never write back to your provider's records.</li>
      </ul>

      <h2>3. Photos and files</h2>
      <ul>
        <li>You can upload photos of medicine labels, lab reports, doctor's notes and other documents. The app reads only the files you pick; it never scans your photo library.</li>
        <li>On Android, camera or photo access is requested only when you tap to add a photo, and you can revoke it in your phone settings.</li>
        <li>Files are stored privately in your account. To read text from them (for example a medicine name or lab value), the image is sent to our AI provider for that one task.</li>
        <li>Deleting a file, or your account, permanently removes it from our storage.</li>
      </ul>

      <h2>4. Location</h2>
      <ul>
        <li>We do not collect your device's GPS or precise location.</li>
        <li>To find nearby specialists you may type a city or ZIP code. It is saved on your own device for convenience and sent with the search only to look up providers.</li>
        <li>You can clear or change it at any time.</li>
      </ul>

      <h2>5. Who processes your data</h2>
      <p>
        Your data is stored encrypted with our cloud hosting provider. AI features are processed by our AI provider. Public
        provider directories (such as the NPI Registry) receive only the search terms needed to find specialists. These
        services handle data only to run SuprimaLabs products for you.
      </p>

      <h2>6. Your choices and rights</h2>
      <ul>
        <li><strong>Export:</strong> download everything from Account &rarr; Export my data.</li>
        <li><strong>Delete:</strong> permanently delete your account and all data from Account &rarr; Delete my account. Deletion is immediate and cannot be undone.</li>
        <li><strong>Withdraw consent:</strong> delete your account, or reach us through the {contact}.</li>
        <li>Depending on where you live (for example Washington, California, Connecticut or Nevada), you may have more rights to access, correct or delete your data. Use the {contact} to exercise them.</li>
      </ul>

      <h2>7. Security and breaches</h2>
      <p>
        Data is encrypted in transit and at rest, and each account can read only its own records. If a breach affects your
        health information, we will notify you and the authorities as the law requires.
      </p>

      <h2>8. Retention</h2>
      <p>We keep your data while your account is active. When you delete your account, your data and files are removed. Contact-form messages are kept only as long as needed to respond.</p>

      <h2>9. Children</h2>
      <p>Our products are for people 18 and older.</p>

      <h2>10. Not medical advice</h2>
      <p>Pulse Journal is not a medical device and does not diagnose or treat any condition. In an emergency, call 911.</p>

      <h2>11. Changes and contact</h2>
      <p>If we change this policy, we'll update the date above and tell you in the app before material changes apply. Questions? Use our {contact}.</p>
    </LegalPage>
  );
}
