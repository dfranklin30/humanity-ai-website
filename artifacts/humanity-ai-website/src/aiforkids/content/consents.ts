/**
 * Itemised consents for AI Builders Academy enrollment.
 *
 * These are agreed SEPARATELY — never bundled behind a single checkbox — and
 * the accepted set is stored with a timestamp and this version string.
 *
 * LEGAL REVIEW REQUIRED: this language was drafted to be plain, specific and
 * COPPA-aware (enrollment is parent-initiated; students under 13 do not create
 * their own accounts on third-party AI services). It has NOT been reviewed by
 * an attorney. Have counsel review before the first paid cohort.
 */

export const CONSENT_VERSION = "2026-08-04.1";

export type ConsentItem = {
  id: string;
  required: boolean;
  label: string;
  detail: string;
};

export const CONSENTS: ConsentItem[] = [
  {
    id: "guardian",
    required: true,
    label: "I am the parent or legal guardian of this student, and I am enrolling them.",
    detail:
      "Enrollment in AI Builders Academy is opened by an adult. Students do not enroll themselves, and we do not accept a registration submitted by anyone other than a parent or legal guardian.",
  },
  {
    id: "ai_tools",
    required: true,
    label: "I consent to my student using supervised AI tools during class.",
    detail:
      "Students use age-appropriate AI tools for text, images, audio, video and code with an instructor present and safety filters enabled. Students in grades 3–5 work on instructor-operated accounts rather than creating their own. Students are taught in Week 1 never to enter personal information into any AI system, and that rule is enforced every session. The specific tool list for your cohort is emailed before the first session.",
  },
  {
    id: "privacy",
    required: true,
    label: "I have read how my family's information is used.",
    detail:
      "We collect only what running the program requires: your contact details, your student's first name and last initial, grade band, and anything you choose to tell us about allergies, medical needs or accommodations. We do not collect a student's full name, home address, birth date or photograph unless you separately agree below. Your information is never sold, never used for advertising, and is shared only with the instructor and host site staff who need it. You may ask us to delete it at any time by emailing danielle@humanityplusai.org.",
  },
  {
    id: "waiver",
    required: true,
    label: "I agree to the activity waiver and student code of conduct.",
    detail:
      "I understand my student will participate in an in-person after-school program at a host site, and I release Humanity + AI, Inc., its instructors and the host site from liability for ordinary risks of participation. I agree my student will follow the code of conduct: respect other students, use AI tools only as directed, and never share personal information about themselves or anyone else. In a medical emergency where I cannot be reached, I authorize staff to seek emergency care.",
  },
  {
    id: "media",
    required: false,
    label: "Optional: my student may appear in photos or video of the program.",
    detail:
      "Used for the Week 8 showcase recap, grant reporting and the Humanity + AI website. Students are never identified by full name. Declining changes nothing about your student's participation — we simply keep them out of frame. You can withdraw this at any time.",
  },
  {
    id: "updates",
    required: false,
    label: "Optional: email me about future programs and scholarship openings.",
    detail: "Occasional email from Humanity + AI. Unsubscribe any time; unrelated to this enrollment.",
  },
];
