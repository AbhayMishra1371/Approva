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

## 📄 License

This project is private and proprietary.
