# Deploying December Scribbles on AWS

A step-by-step guide for a first production launch. It takes about 2–3 hours, plus waiting time
for DNS and email verification.

## Why AWS rather than Azure

The application already talks to **S3** for images, and to SMTP for email. On AWS those are
native services (Amazon S3 and Amazon SES), so **no code changes** are needed. Azure Blob
Storage does not speak the S3 API, so Azure would mean rewriting and re-testing the media
storage module. Both clouds can run the rest equally well.

## What you will build

```
Visitor ──HTTPS──▶ EC2 (Ubuntu + Docker)
                     ├─ Caddy      automatic HTTPS certificates, ports 80/443
                     ├─ web        Next.js website
                     └─ api        NestJS API (private, never exposed)
                          ├─▶ Amazon RDS PostgreSQL 17   (data, automated daily backups)
                          ├─▶ Amazon S3 ◀── CloudFront   (images, fast public delivery)
                          └─▶ Amazon SES (SMTP)          (enquiry emails)
```

One server suits this site. The API's rate limits are per instance, which is correct for a
single server. The files for this setup are in [deploy/aws/](../deploy/aws/).

**Approximate monthly cost** (on-demand prices in Mumbai, `ap-south-1`, as an estimate):

- EC2 `t3.small` + 30 GB disk: about $19
- RDS `db.t4g.micro` + 20 GB: about $15
- Public IPv4 address: about $4
- S3, CloudFront and SES at this traffic: under $2

That is roughly **$35–40 a month**. New AWS accounts may receive free-tier credits that cover
part of this for a while. Confirm current prices in the
[AWS Pricing Calculator](https://calculator.aws/) before you start.

**Region:** this guide uses **`ap-south-1` (Mumbai)**. Choose the region closest to most of your
readers, and use the **same region for every service**.

---

## Step 1: Prepare your AWS account

1. Create an AWS account at <https://aws.amazon.com>, or sign in to an existing one.
2. Turn on **MFA for the root user**: account menu → _Security credentials_ → _Assign MFA_.
3. Create a budget alert: **Billing → Budgets → Create budget**, a _monthly cost budget_ of, for
   example, $50, with an email alert at 80%.
4. In the top-right region picker, select **Asia Pacific (Mumbai) ap-south-1**.
5. Install the **AWS CLI** on your computer (Windows: `winget install Amazon.AWSCLI`). Run
   `aws configure` with an access key for **your own administrator** IAM user (not the root
   user), and set the default region to `ap-south-1`.

You also need a **domain name**. In this guide `decemberscribbles.example` stands for yours.

## Step 2: Put the code in a private Git repository

On your computer, from the project folder:

```sh
git checkout -b main
git add -A
git commit -m "December Scribbles: initial release"
# Create an empty PRIVATE repository on GitHub first, then:
git remote add origin git@github.com:<you>/december-scribbles.git
git push -u origin main
```

`.env` files are git-ignored, so no secrets are pushed. Check `git status` before committing.

## Step 3: Images: S3 bucket and CloudFront

1. **S3 → Create bucket**
   - Name: `decemberscribbles-media`. Names are global; add a suffix if it's taken.
   - Region: `ap-south-1`.
   - Keep **Block all public access ON**. CloudFront will read it privately.
   - Turn **Bucket versioning** on. This lets you undo accidental image deletions.
2. **CloudFront → Create distribution**
   - Origin domain: pick your bucket.
   - Origin access: **Origin access control settings (recommended)** → _Create new OAC_.
   - Viewer protocol policy: **Redirect HTTP to HTTPS**.
   - Cache policy: **CachingOptimized**.
   - WAF: _Do not enable_ (optional extra cost).
   - Create the distribution. CloudFront then shows a **bucket policy** to copy. Copy it, open
     **S3 → your bucket → Permissions → Bucket policy**, paste it and save.
3. Note the distribution's domain, for example `https://d1a2b3c4d5e6f7.cloudfront.net`.
   This is your `MEDIA_PUBLIC_BASE_URL`.

## Step 4: A limited key for the API to upload images

1. **IAM → Users → Create user**: `ds-api-media`, with no console access.
2. _Attach policies directly → Create policy → JSON_. Use the policy below, replacing the
   bucket name, and name it `ds-api-media-access`:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::decemberscribbles-media/*"
       },
       {
         "Effect": "Allow",
         "Action": ["s3:ListBucket"],
         "Resource": "arn:aws:s3:::decemberscribbles-media"
       }
     ]
   }
   ```

   The API only uploads, deletes and checks that the bucket exists. `ListBucket` is what the
   bucket check needs.

3. Attach the policy to the user, then **Security credentials → Create access key → Application
   running outside AWS**. Copy the key ID and secret: they are `S3_ACCESS_KEY_ID` and
   `S3_SECRET_ACCESS_KEY`. The secret is shown only once.

## Step 5: The server: EC2

1. **EC2 → Launch instance**
   - Name: `december-scribbles`
   - Image: **Ubuntu Server 24.04 LTS (x86_64)**
   - Type: **t3.small** (2 GB RAM)
   - Key pair: _Create new key pair_ (`.pem`) and keep the file safe.
   - Network settings → _Create security group_ `ds-web` with these rules:
     - **SSH 22** from **My IP** only
     - **HTTP 80** from anywhere
     - **HTTPS 443** from anywhere
   - Storage: **30 GB gp3**
2. **EC2 → Elastic IPs → Allocate**, then _Associate_ it with the instance. The server's public
   address then never changes.

## Step 6: The database: RDS PostgreSQL

1. **RDS → Create database → Standard create**
   - Engine: **PostgreSQL**, version **17.x**. Your local database is 17, so data moves across
     cleanly.
   - Template: **Free tier** if offered, otherwise **Dev/Test**, with **Single-AZ**.
   - DB instance identifier: `december-scribbles-db`
   - Master username: `ds_admin`. Set a strong password and store it in a password manager.
   - Instance: **db.t4g.micro**. Storage: **20 GB gp3**.
   - Connectivity:
     - **Don't connect to an EC2 compute resource**
     - **Public access: No**
     - VPC security group: create new, `ds-db`
   - Additional configuration:
     - Initial database name: **`december_scribbles`**
     - Automated backups: **on, 7 days**
     - Deletion protection: **on**
2. After it is created, open **EC2 → Security groups → `ds-db` → Edit inbound rules**. Use only
   one rule: **PostgreSQL 5432** with source = the **`ds-web` security group**. Then only your
   server can reach the database.
3. Copy the database **endpoint**, for example
   `december-scribbles-db.abc123.ap-south-1.rds.amazonaws.com`.

## Step 7: Point your domain at the server

At your domain registrar, or in **Route 53** if you host DNS there, create:

| Type | Name                            | Value           |
| ---- | ------------------------------- | --------------- |
| A    | `decemberscribbles.example`     | your Elastic IP |
| A    | `www.decemberscribbles.example` | your Elastic IP |

Wait until `nslookup decemberscribbles.example` returns the Elastic IP. This is usually minutes,
but can take hours. HTTPS certificates are issued only once DNS points at the server.

## Step 8: Email: Amazon SES

1. **SES → Identities → Create identity → Domain**: `decemberscribbles.example`, with
   **Easy DKIM**. Add the 3 CNAME records it shows to your DNS (Route 53 can add them
   automatically). Wait for **Verified**.
2. **Create identity → Email address**: your own inbox, the one that should receive enquiries.
   Click the link in the verification email.
3. **SES → SMTP settings → Create SMTP credentials**. Copy the SMTP username and password:
   they are `SMTP_USER` and `SMTP_PASSWORD`. The host is `email-smtp.ap-south-1.amazonaws.com`.

New SES accounts start in a **sandbox** that only sends to verified addresses. That is
enough here, because the site only emails _you_ (`ENQUIRY_NOTIFY_TO`). No production-access
request is needed.

## Step 9: Set up the server

Connect from your computer:

```sh
ssh -i path/to/your-key.pem ubuntu@<ELASTIC_IP>
```

Then, on the server:

```sh
# 2 GB of swap so the production build doesn't run out of memory on a 2 GB machine
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Docker Engine + Compose plugin (official install script)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu && exit
```

Reconnect with SSH so the Docker group takes effect, then:

```sh
sudo apt-get install -y git
git clone git@github.com:<you>/december-scribbles.git   # or the HTTPS URL with a token
cd december-scribbles/deploy/aws
cp env.production.example .env.production
nano .env.production
chmod 600 .env.production
```

Fill in every `CHANGE_ME` and example value in `.env.production`:

| Setting                                    | Value                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `DOMAIN`, `FRONTEND_ORIGINS`               | your domain (`FRONTEND_ORIGINS` with `https://`)                                                          |
| `ACME_EMAIL`                               | your email, for certificate notices                                                                       |
| `DATABASE_URL`                             | `postgresql://ds_admin:<password>@<rds-endpoint>:5432/december_scribbles?schema=public&sslmode=require`   |
| `S3_BUCKET`, `S3_REGION`                   | from Step 3                                                                                               |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | from Step 4                                                                                               |
| `MEDIA_PUBLIC_BASE_URL`                    | the CloudFront URL from Step 3                                                                            |
| `SMTP_USER`, `SMTP_PASSWORD`               | from Step 8                                                                                               |
| `MAIL_FROM`                                | an address at your verified domain, for example `December Scribbles <no-reply@decemberscribbles.example>` |
| `ENQUIRY_NOTIFY_TO`                        | your inbox                                                                                                |

If the database password contains special characters (`@ : / ? # &`), URL-encode them in
`DATABASE_URL`, for example `@` → `%40`.

## Step 10: Bring your existing content across (recommended)

Your posts, artwork, About text, images and Studio login currently live in the local Docker
database and the local S3 emulator. Copy them over once, before the first launch. Image URLs are
built from the storage keys, so the keys simply need to match.

**On your computer**, with the local stack running (`docker compose up -d`):

```sh
# 1. Database snapshot
docker compose exec -T postgres pg_dump -U ds -d december_scribbles --no-owner --no-acl -Fc > ds.dump

# 2. Images out of the local S3 emulator, then up to the real bucket
AWS_ACCESS_KEY_ID=x AWS_SECRET_ACCESS_KEY=x aws s3 sync s3://ds-media ./media-export --endpoint-url http://localhost:9090
aws s3 sync ./media-export s3://decemberscribbles-media --cache-control "public, max-age=31536000, immutable"

# 3. Send the snapshot to the server
scp -i path/to/your-key.pem ds.dump ubuntu@<ELASTIC_IP>:~/
```

**On the server**, restore it into RDS. Note that the URL below has **no `?schema=public`**:
`pg_restore` doesn't accept that option.

```sh
docker run --rm -v ~/ds.dump:/ds.dump postgres:17 pg_restore --no-owner --no-acl \
  -d "postgresql://ds_admin:<password>@<rds-endpoint>:5432/december_scribbles?sslmode=require" /ds.dump
rm ~/ds.dump
```

This also brings over your Studio account (`poornagollakoti@gmail.com`) with its current password.

> Starting with an empty site instead? Skip this step and follow "Fresh start" in Step 11.

## Step 11: Launch

On the server:

```sh
cd ~/december-scribbles/deploy/aws
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

The first build takes about 5–10 minutes. The `migrate` container applies any database
migrations first (after a restore there is nothing to apply), then the API starts, then the
website, then Caddy fetches the HTTPS certificate.

To check progress:

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f caddy api
```

**Fresh start only** (no content copied in Step 10): create the site profile and your Studio
login. Run these **from your computer** through an SSH tunnel, using the project's own scripts:

```sh
# Terminal 1: tunnel local port 5434 to the database through the server
ssh -i path/to/your-key.pem -N -L 5434:<rds-endpoint>:5432 ubuntu@<ELASTIC_IP>

# Terminal 2: in the project folder
export DATABASE_URL="postgresql://ds_admin:<password>@localhost:5434/december_scribbles?schema=public&sslmode=require"
npm run prisma:seed -w @ds/api
npm run admin:create -w @ds/api -- --email you@example.com --name "Your name"
```

## Step 12: Smoke test

- [ ] `https://decemberscribbles.example` loads with a padlock, and `http://` and `www.`
      redirect to it.
- [ ] The homepage shows your writing and artwork, and the images load from `*.cloudfront.net`.
- [ ] A writing page and an artwork page open. A wrong URL shows the "wandered off" page.
- [ ] Send a test message through **Contact**. It appears in **Studio → Enquiries** and you
      receive the email. If not, the enquiry shows "email notification was not sent"; check the
      SES settings.
- [ ] Sign in to `/admin`, upload an image in **Media**, and check that it shows on the site.
- [ ] `docker compose ... logs api` shows no errors.

## Updating the site later

On your computer, commit and push. Then on the server:

```sh
cd ~/december-scribbles && git pull
cd deploy/aws && docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker image prune -f
```

Migrations run automatically before the new API starts. Before releases that change the
database, take a manual snapshot first: **RDS → your DB → Actions → Take snapshot**.

**Rollback:** `git checkout <previous-commit>`, then run the same `up -d --build`.

## Backups and monitoring

- **Database:** RDS automated backups (7 days, point-in-time restore), plus manual snapshots
  before big changes.
- **Images:** S3 versioning (Step 3) keeps deleted or overwritten images recoverable.
- **Server health:** **EC2 → your instance → Status checks → Create alarm**, with an email
  notification when the instance status check fails.
- **Costs:** the budget alert from Step 1.
- **Security updates:** run `sudo apt-get update && sudo apt-get upgrade -y` on the server
  monthly, and rebuild the images when Node.js security releases come out.

## Growing later

If traffic grows beyond one server, move the two containers to **ECS Fargate** behind an
**Application Load Balancer**. Before running several API instances, switch rate limiting to a
shared store (for example ElastiCache Redis); see [DEPLOYMENT.md](DEPLOYMENT.md).
