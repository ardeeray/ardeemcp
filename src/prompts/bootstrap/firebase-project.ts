import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerFirebaseProjectPrompt(server: McpServer): void {
  server.registerPrompt(
    'bootstrap-firebase-project',
    {
      description:
        'Scaffold a standalone Terraform repo that provisions a full Firebase project: Firestore, Firebase Auth (email + Google), Storage, a service account for Admin SDK, and web/Android/iOS app registrations. Outputs generate-env.sh that writes .env files for both the Flutter app and the Next.js portal.',
      argsSchema: {
        projectName: z
          .string()
          .describe('Project name in kebab-case, e.g. "my-app". Used as the GCP/Firebase project ID prefix and infra repo name.'),
        billingAccountId: z
          .string()
          .describe('GCP billing account ID, e.g. "012345-ABCDEF-012345". Run: gcloud billing accounts list'),
        region: z
          .string()
          .optional()
          .describe('GCP region for Firestore, Functions, etc. (default: us-central1)'),
        androidPackageName: z
          .string()
          .optional()
          .describe('Android package name, e.g. "com.example.myapp" (default: com.example.[projectName with hyphens removed])'),
        iosBundleId: z
          .string()
          .optional()
          .describe('iOS bundle ID, e.g. "com.example.myapp" (default: same as androidPackageName)'),
        flutterRepoName: z
          .string()
          .optional()
          .describe('Flutter app repo name (default: [projectName with hyphens replaced by underscores])'),
        portalRepoName: z
          .string()
          .optional()
          .describe('Portal repo name (default: [projectName]-portal)'),
      },
    },
    ({
      projectName,
      billingAccountId,
      region = 'us-central1',
      androidPackageName,
      iosBundleId,
      flutterRepoName,
      portalRepoName,
    }) => {
      const flutterRepo = flutterRepoName ?? projectName.replace(/-/g, '_');
      const portalRepo = portalRepoName ?? `${projectName}-portal`;
      const androidPkg =
        androidPackageName ?? `com.example.${projectName.replace(/-/g, '')}`;
      const iosBundleIdVal = iosBundleId ?? androidPkg;
      const cookieName = `${portalRepo.replace(/-/g, '_')}_session`;

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Scaffold a Terraform infrastructure repo called **${projectName}-infra** that provisions a complete Firebase project for the \`${flutterRepo}\` Flutter app and \`${portalRepo}\` portal.

The repo lives as a sibling directory alongside the app repos:
\`\`\`
parent-directory/
├── ${flutterRepo}/
├── ${portalRepo}/
└── ${projectName}-infra/   ← create this
\`\`\`

---

## Step 1 — Create the infra directory

\`\`\`bash
mkdir ${projectName}-infra
cd ${projectName}-infra
\`\`\`

---

## Step 2 — Create variables.tf

\`\`\`hcl
variable "project_id" {
  description = "GCP project ID (must be globally unique, e.g. my-app-prod-abc123)"
  type        = string
}

variable "project_name" {
  description = "Human-readable project name"
  type        = string
  default     = "${projectName}"
}

variable "billing_account_id" {
  description = "GCP billing account ID"
  type        = string
  default     = "${billingAccountId}"
}

variable "region" {
  description = "Primary GCP region"
  type        = string
  default     = "${region}"
}

variable "android_package_name" {
  description = "Android app package name"
  type        = string
  default     = "${androidPkg}"
}

variable "ios_bundle_id" {
  description = "iOS app bundle ID"
  type        = string
  default     = "${iosBundleIdVal}"
}

variable "web_app_name" {
  description = "Firebase web app display name"
  type        = string
  default     = "${projectName}-web"
}

variable "admin_service_account_id" {
  description = "Service account ID for Firebase Admin SDK"
  type        = string
  default     = "${projectName}-admin-sa"
}
\`\`\`

---

## Step 3 — Create outputs.tf

\`\`\`hcl
output "project_id" {
  description = "GCP project ID"
  value       = google_project.project.project_id
}

output "web_app_id" {
  description = "Firebase web app ID"
  value       = google_firebase_web_app.web.app_id
}

output "android_app_id" {
  description = "Firebase Android app ID"
  value       = google_firebase_android_app.android.app_id
}

output "ios_app_id" {
  description = "Firebase iOS app ID"
  value       = google_firebase_apple_app.ios.app_id
}

output "admin_service_account_email" {
  description = "Firebase Admin SDK service account email"
  value       = google_service_account.admin_sa.email
}

output "web_api_key" {
  description = "Firebase web API key (NEXT_PUBLIC_FIREBASE_API_KEY)"
  value       = data.google_firebase_web_app_config.web_config.api_key
  sensitive   = true
}

output "firebase_auth_domain" {
  description = "Firebase auth domain (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)"
  value       = data.google_firebase_web_app_config.web_config.auth_domain
}

output "storage_bucket" {
  description = "Firebase Storage default bucket"
  value       = data.google_firebase_web_app_config.web_config.storage_bucket
}

output "messaging_sender_id" {
  description = "Firebase messaging sender ID (NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)"
  value       = data.google_firebase_web_app_config.web_config.messaging_sender_id
}
\`\`\`

---

## Step 4 — Create main.tf (spec — agent generates)

Generate a complete \`main.tf\` that provisions all of the following resources in order.
Use \`google-beta\` provider where noted. Set \`depends_on\` explicitly to avoid race conditions.

### Required Terraform resources

\`\`\`
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}
\`\`\`

Provision in this order:

1. **google_project** — create the GCP project, link billing account
   - \`billing_account = var.billing_account_id\`
   - \`auto_create_network = false\`

2. **google_project_service** (one per API, \`disable_on_destroy = false\`) — enable:
   - \`firebase.googleapis.com\`
   - \`firestore.googleapis.com\`
   - \`identitytoolkit.googleapis.com\`
   - \`storage.googleapis.com\`
   - \`cloudfunctions.googleapis.com\`
   - \`cloudresourcemanager.googleapis.com\`
   - \`cloudbilling.googleapis.com\`

3. **google_firebase_project** (google-beta) — link Firebase to the GCP project
   - \`depends_on\` on all google_project_service resources

4. **google_firestore_database** — create Firestore in native mode
   - \`location_id = var.region\`
   - \`type = "FIRESTORE_NATIVE"\`
   - \`depends_on\` on google_firebase_project

5. **google_identity_platform_config** (google-beta) — enable Firebase Auth
   - \`sign_in block\` with email + Google OAuth enabled
   - \`depends_on\` on google_project_service["identitytoolkit"]

6. **google_identity_platform_oauth_idp_config** (google-beta) — configure Google OAuth provider
   - \`name = "oidc.google"\`
   - Note: requires OAuth client ID/secret — output a TODO comment in the generated file

7. **google_firebase_storage_bucket** (google-beta) — create default Storage bucket
   - \`bucket_id = "\${var.project_id}.appspot.com"\`
   - \`depends_on\` on google_firebase_project

8. **google_firebase_web_app** (google-beta) — register web app
   - \`display_name = var.web_app_name\`
   - \`depends_on\` on google_firebase_project

9. **data.google_firebase_web_app_config** — fetch web app config (for outputs)
   - \`app_id = google_firebase_web_app.web.app_id\`

10. **google_firebase_android_app** (google-beta) — register Android app
    - \`package_name = var.android_package_name\`
    - \`display_name = "\${var.project_name}-android"\`

11. **google_firebase_apple_app** (google-beta) — register iOS app
    - \`bundle_id = var.ios_bundle_id\`
    - \`display_name = "\${var.project_name}-ios"\`

12. **google_service_account** — create Admin SDK service account
    - \`account_id = var.admin_service_account_id\`
    - \`display_name = "Firebase Admin SDK service account for \${var.project_name}"\`

13. **google_project_iam_member** — grant Firebase Admin role
    - \`role = "roles/firebase.admin"\`

14. **google_service_account_key** — create key for Admin SDK
    - Store in \`local_file\` resource as \`admin-key.json\`
    - Add \`admin-key.json\` to .gitignore

---

## Step 5 — Create terraform.tfvars.example

\`\`\`hcl
# Copy to terraform.tfvars and fill in before running terraform apply
project_id           = "${projectName}-prod-CHANGE_ME"   # must be globally unique
billing_account_id   = "${billingAccountId}"
region               = "${region}"
android_package_name = "${androidPkg}"
ios_bundle_id        = "${iosBundleIdVal}"
\`\`\`

---

## Step 6 — Create .gitignore

\`\`\`gitignore
# Terraform state — never commit
*.tfstate
*.tfstate.backup
.terraform/
.terraform.lock.hcl

# Terraform vars with secrets
terraform.tfvars

# Generated secrets
admin-key.json
*.env
portal.env
flutter.env

# macOS
.DS_Store
\`\`\`

---

## Step 7 — Create scripts/generate-env.sh

\`\`\`bash
#!/usr/bin/env bash
# generate-env.sh — reads terraform output and writes .env files for portal and Flutter
# Run after: terraform apply
# Requires: terraform CLI, jq

set -euo pipefail

echo "Reading Terraform outputs..."

PROJECT_ID=$(terraform output -raw project_id)
WEB_API_KEY=$(terraform output -raw web_api_key)
AUTH_DOMAIN=$(terraform output -raw firebase_auth_domain)
STORAGE_BUCKET=$(terraform output -raw storage_bucket)
MESSAGING_SENDER_ID=$(terraform output -raw messaging_sender_id)
WEB_APP_ID=$(terraform output -raw web_app_id)
ADMIN_SA_EMAIL=$(terraform output -raw admin_service_account_email)

# Read Admin SDK private key from the generated key file
ADMIN_PRIVATE_KEY=$(jq -r '.private_key' admin-key.json | sed 's/\\n/\\\\n/g')

# --- portal.env ---
cat > portal.env <<EOF
# Generated by generate-env.sh — copy contents to ${portalRepo}/.env.local
# DO NOT COMMIT this file

NEXT_PUBLIC_FIREBASE_API_KEY=\${WEB_API_KEY}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=\${AUTH_DOMAIN}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=\${PROJECT_ID}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=\${STORAGE_BUCKET}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=\${MESSAGING_SENDER_ID}
NEXT_PUBLIC_FIREBASE_APP_ID=\${WEB_APP_ID}

FIREBASE_ADMIN_PROJECT_ID=\${PROJECT_ID}
FIREBASE_ADMIN_CLIENT_EMAIL=\${ADMIN_SA_EMAIL}
FIREBASE_ADMIN_PRIVATE_KEY="\${ADMIN_PRIVATE_KEY}"

SESSION_COOKIE_NAME=${cookieName}
EOF

# --- flutter.env ---
cat > flutter.env <<EOF
# Generated by generate-env.sh — copy contents to ${flutterRepo}/.env
# DO NOT COMMIT this file

FIREBASE_PROJECT_ID=\${PROJECT_ID}
EOF

echo ""
echo "✅ Generated portal.env and flutter.env"
echo ""
echo "Next steps:"
echo "  1. Copy portal.env contents → ${portalRepo}/.env.local"
echo "  2. Copy flutter.env contents → ${flutterRepo}/.env"
echo "  3. Run flutterfire configure in ${flutterRepo}/"
echo "  4. Download google-services.json (Android) and GoogleService-Info.plist (iOS) from Firebase Console"
\`\`\`

Make executable:
\`\`\`bash
chmod +x scripts/generate-env.sh
\`\`\`

---

## Step 8 — Create README.md

Generate a README with:
- Overview: what this Terraform config provisions
- Prerequisites section:
  - Terraform >= 1.5
  - Google Cloud SDK (\`gcloud\`)
  - \`gcloud auth application-default login\`
  - Firebase CLI (\`npm install -g firebase-tools\`)
  - \`jq\` (for generate-env.sh)
- Step-by-step walkthrough:
  1. Copy \`terraform.tfvars.example\` to \`terraform.tfvars\`, fill in project_id
  2. \`terraform init\`
  3. \`terraform plan\` — review what will be created
  4. \`terraform apply\` — provisions all resources (~3-5 min)
  5. \`bash scripts/generate-env.sh\` — writes portal.env and flutter.env
  6. Copy env files to their repos (instructions printed by script)
  7. Enable Google OAuth in Firebase Console → Authentication → Sign-in method (manual step)
  8. Download native config files (google-services.json, GoogleService-Info.plist) from Firebase Console
- Resources created table (lists all 14 resource types)
- Teardown section: \`terraform destroy\` — warns this deletes all data

---

## Step 9 — Final structure

\`\`\`
${projectName}-infra/
├── main.tf                      # all Terraform resources
├── variables.tf                 # input variables
├── outputs.tf                   # terraform output values
├── terraform.tfvars.example     # copy → terraform.tfvars and fill in
├── .gitignore                   # excludes .tfstate, terraform.tfvars, *.env, admin-key.json
├── README.md                    # walkthrough
└── scripts/
    └── generate-env.sh          # reads terraform output → writes portal.env + flutter.env
\`\`\`

---

## Step 10 — Verification checklist

- [ ] \`terraform init\` succeeds
- [ ] \`terraform validate\` passes
- [ ] \`terraform plan\` shows ~14 resources to add, 0 to change, 0 to destroy
- [ ] \`terraform apply\` completes without errors
- [ ] \`bash scripts/generate-env.sh\` writes portal.env and flutter.env
- [ ] portal.env contains all 9 required env vars
- [ ] flutter.env contains FIREBASE_PROJECT_ID
- [ ] Firebase Console shows: Firestore, Auth, Storage, web+Android+iOS app registrations

> **Security note:** \`admin-key.json\` and \`*.env\` are gitignored. Never commit service account keys. Rotate via GCP Console if accidentally exposed.
`,
            },
          },
        ],
      };
    },
  );
}
