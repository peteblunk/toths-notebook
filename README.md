# Firebase Studio

# 📜 Thoth's Notebook

*Manage your tasks with the wisdom of the ancients and the power of modern technology.*

<img width="2550" height="1220" alt="image" src="https://github.com/user-attachments/assets/324604f2-9f4b-4fb9-a08c-f11922770b13" />


---

## ✨ About The Project

**Thoth's Notebook** is a task management application designed for the modern polymath. Inspired by Thoth, the ancient Egyptian deity of wisdom, writing, and knowledge, this app provides a unique and motivating interface to organize your daily rituals, manage complex projects, and track your diverse responsibilities.

The application merges a sleek, cyberpunk aesthetic with ancient mythology to create a space where productivity feels like uncovering secret knowledge. Whether you're juggling work, personal hobbies, or long-term goals, Thoth's Notebook is your personal scribe, helping you bring order to chaos and turn ambitious plans into tangible progress.

### Built With

This project leverages a modern, powerful tech stack to deliver a fast, responsive, and scalable experience.

* **[Next.js](https://nextjs.org/)** - The React Framework for the Web
* **[React](https://reactjs.org/)** - A JavaScript library for building user interfaces
* **[TypeScript](https://www.typescriptlang.org/)** - Strong-typed programming language that builds on JavaScript
* **[Tailwind CSS](https://tailwindcss.com/)** - A utility-first CSS framework for rapid UI development
* **[Firebase](https://firebase.google.com/)** - Backend platform for building web and mobile applications (used for Authentication and Firestore Database)
* **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable components built using Radix UI and Tailwind CSS

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have Node.js and npm (or yarn/pnpm) installed on your machine.

* npm
    ```sh
    npm install npm@latest -g
    ```

### Installation

1.  **Clone the repository**
    ```sh
    git clone [https://github.com/your-username/thoths-notebook.git](https://github.com/your-username/thoths-notebook.git)
    ```
2.  **Navigate to the project directory**
    ```sh
    cd thoths-notebook
    ```
3.  **Install NPM packages**
    ```sh
    npm install
    ```
4.  **Set up your environment variables**

    Create a `.env.local` file in the root of your project and add your Firebase configuration keys. You can get these from your Firebase project console.

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    ```

5.  **Run the development server**
    ```sh
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📂 Project Structure

The application follows the standard Next.js App Router structure.


thoths-notebook/
├── app/
│   ├── (main)/
│   │   └── page.tsx        # The main application page component
│   ├── globals.css       # Global styles
│   └── layout.tsx        # The root layout of the application
├── components/
│   ├── app-sidebar.tsx   # The main navigation sidebar
│   ├── task-list.tsx     # Component to display and manage tasks
│   └── ui/               # Re-usable UI components (from shadcn/ui)
├── lib/
│   ├── firebase.ts       # Firebase configuration and initialization
│   └── types.ts          # TypeScript type definitions
└── ...


---

## 🌟 Features

* **Themed Interface:** A dark, futuristic UI inspired by ancient Egyptian mythology.
* **Task Management:** Create, update, and delete tasks with ease.
* **Category Filtering:** Organize tasks into categories like "Today," "Daily Rituals," "Responsibilities,", "Special Missions", and "Grand Expeditions using the sidebar.
* **Persistent Storage:** All tasks are securely stored and synced in real-time using Google Firestore.
* **User Authentication:** Secure login system powered by Firebase Auth to protect your personal data.
* **Responsive Design:** Fully functional and beautiful on all devices, from desktop to mobile.

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE.txt` for more information.
