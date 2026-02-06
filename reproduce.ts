/**
 * Minimal reproduction: Resend dashboard strips inline styles from templates
 *
 * This script:
 * 1. Uploads an HTML template with inline styles to Resend
 * 2. Fetches it back to prove the stored HTML is correct
 * 3. Optionally sends via resend.emails.send() to prove direct API works
 *
 * After running, open the Resend dashboard to compare:
 * - Dashboard preview -> styles missing on <p>, <h1>, <a>, <hr>
 * - Send test email from dashboard -> same missing styles
 * - Email received via direct API send -> all styles correct
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx bun run reproduce.ts
 *   RESEND_API_KEY=re_xxx TEST_EMAIL=you@example.com FROM_EMAIL=you@yourdomain.com bun run reproduce.ts
 */

import { readFileSync } from "node:fs";
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL;

if (!RESEND_API_KEY) {
  console.error("RESEND_API_KEY is required");
  console.error(
    "   Usage: RESEND_API_KEY=re_xxx bun run reproduce.ts"
  );
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);
const html = readFileSync("template.html", "utf-8");

/**
 * Styles that should be present on typography elements.
 * If any of these are missing after fetching back from Resend,
 * the template processing has stripped them.
 */
const EXPECTED_STYLES = [
  { label: "Pink accent color (#ec4899)", pattern: "#ec4899" },
  { label: "White heading color (#ffffff on h1)", pattern: "color:#ffffff" },
  { label: "Gray body text color (#d1d5db)", pattern: "#d1d5db" },
  { label: "Georgia font-family", pattern: "Georgia" },
  { label: "text-transform:uppercase", pattern: "text-transform:uppercase" },
  { label: "letter-spacing:2px", pattern: "letter-spacing:2px" },
  { label: "Custom hr border (#374151)", pattern: "#374151" },
];

async function main() {
  const timestamp = new Date().toISOString().slice(0, 16);

  console.log("=".repeat(60));
  console.log("Resend Template Inline Styles - Reproduction Script");
  console.log("=".repeat(60));

  // -- Step 1: Upload template --
  console.log("\nStep 1: Uploading template to Resend...");

  const { data: created, error: createError } =
    await resend.templates.create({
      name: `Style Test (${timestamp})`,
      subject: "Inline Style Preservation Test",
      html,
    });

  if (createError) {
    console.error("Failed to create template:", createError.message);
    process.exit(1);
  }

  const templateId = created?.id;
  console.log(`Template created: ${templateId}`);

  // -- Step 2: Fetch it back --
  console.log("\nStep 2: Fetching template back from Resend API...");

  const { data: fetched, error: fetchError } =
    await resend.templates.get(templateId!);

  if (fetchError) {
    console.error("Failed to fetch template:", fetchError.message);
    process.exit(1);
  }

  const storedHtml = fetched?.html ?? "";
  console.log(`   Stored HTML size: ${storedHtml.length} bytes`);

  let allPresent = true;
  for (const { label, pattern } of EXPECTED_STYLES) {
    const found = storedHtml.includes(pattern);
    console.log(`   ${found ? "PASS" : "FAIL"} ${label}`);
    if (!found) allPresent = false;
  }

  if (allPresent) {
    console.log("\n-> All inline styles are intact in Resend storage.");
    console.log("-> Now open the Resend dashboard, preview this template,");
    console.log("   and send a test email from the dashboard to see the bug.");
  } else {
    console.log("\nWARNING: Some styles were stripped during upload/storage.");
  }

  // -- Step 3: (Optional) Send via direct API --
  if (TEST_EMAIL && FROM_EMAIL) {
    console.log(`\nStep 3: Sending same HTML via resend.emails.send()...`);

    const { data: sent, error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TEST_EMAIL,
      subject: `[Style Test] Direct API Send (${timestamp})`,
      html,
    });

    if (sendError) {
      console.error("Failed to send:", sendError.message);
    } else {
      console.log(`Email sent: ${sent?.id}`);
      console.log(`-> Check ${TEST_EMAIL} - this email should have all styles.`);
    }
  } else {
    console.log("\nStep 3: Skipped (set TEST_EMAIL and FROM_EMAIL to send)");
  }

  // -- Summary --
  console.log("\n" + "=".repeat(60));
  console.log("COMPARE:");
  console.log("  1. Resend Dashboard -> Templates -> Preview    -> Styles missing");
  console.log("  2. Resend Dashboard -> Send test email         -> Styles missing");
  console.log("  3. Email from direct API send (your inbox)    -> Styles correct");
  console.log("=".repeat(60));

  // -- Cleanup hint --
  console.log(`\nTo clean up: delete template ${templateId} from the dashboard.`);
}

main().catch(console.error);
