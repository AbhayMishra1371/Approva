# Approva

Built for **High-Stakes Asset Approval**. Control the chaos with a Neo-Tech interface designed for rapid sign-offs and visual clarity.

## 🚀 Features

-   **Live Reviews**: Instant sync for your global creative team.
-   **Version Control**: Track every iteration of your assets securely.
-   **Asset Grid**: Beautiful galleries for all your project files.
-   **Enterprise Security**: Bank-grade encryption for your creative IP.
-   **Frame-Accurate Video Feedback**: (In Development) Precise annotations on video assets.
-   **Global Asset Search**: Quickly find what you need across all projects.
-   **Custom Approval Workflows**: Tailor the review process to your team's needs.

## 🛠 Tech Stack

-   **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), TypeScript
-   **Backend-as-a-Service**: [Appwrite](https://appwrite.io/)
-   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
-   **Animations**: [GSAP](https://greensock.com/gsap/)
-   **UI Components**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)

## 🏁 Getting Started

### Prerequisites

-   Node.js 18+ and npm/pnpm/yarn/bun.
-   An Appwrite project instance.
-   Redux Toolkit for state management.

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd Approva
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env.local` file in the root directory and add your Appwrite configuration:
    ```env
    NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
    NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
    APPWRITE_API_KEY=your_api_key
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

-   `src/app`: Next.js App Router pages and API routes.
-   `src/components`: Reusable UI components and section layouts.
-   `src/lib`: Utility functions and Appwrite client/server logic.
-   `src/providers`: React context providers (e.g., Auth, Theme).
-   `Schema`: Database schema definitions (SQL).

## 🔄 Version Control & Release Management

This project uses semantic versioning with automated CI/CD pipelines triggered by version tags.

### Version Bumping

We provide three methods to bump versions:

#### Method 1: Using NPM Scripts (Recommended)
```bash
# For bug fixes (0.1.0 → 0.1.1)
npm run version:patch

# For new features (0.1.0 → 0.2.0)
npm run version:minor

# For breaking changes (0.1.0 → 1.0.0)
npm run version:major
```

#### Method 2: Using the Release Script Directly
```bash
# Make the script executable (first time only)
chmod +x release.sh

# Run the script
./release.sh patch   # or minor, or major
```

### Release Workflow

1. **Bump Version**: Run one of the version commands above
2. **Review Changes**: The script will stage `package.json` and `package-lock.json`
3. **Complete Release**: Run the command output by the script:
   ```bash
   git commit -m "chore: bump version to v0.1.1" && \
   git tag -a "v0.1.1" -m "Release version 0.1.1" && \
   git push origin HEAD --tags
   ```

### Automated CI/CD Pipeline

When you push a version tag (e.g., `v0.1.1`), the GitHub Actions workflow automatically:

1. ✅ Checks out the repository
2. ✅ Sets up Node.js 20
3. ✅ Installs dependencies
4. ✅ Runs linting checks
5. ✅ Builds the Next.js application
6. ✅ Builds a Docker image
7. ✅ Pushes the image to Docker Hub as `approva:latest`

**Important**: The CI/CD pipeline is **only triggered by version tags** (format: `v*.*.*`), not by regular commits to main.

### Version Tag Format

All version tags must follow semantic versioning with a `v` prefix:
- `v0.1.0` - Initial release
- `v0.1.1` - Patch release
- `v0.2.0` - Minor release
- `v1.0.0` - Major release

## 📄 License

This project is private and proprietary.
