# PORTFOLIO GENERATOR: SOYON

# Critical Team Rule
DO NOT PUSH DIRECTLY TO main!

All work must be done on a personal feature branch and submitted through a Pull Request (PR) on GitHub. Direct pushes to main can break the project for everyone.

# How to setup

## Step 1: Prerequisites
1. Install `Git` for Windows
Download the installer from `git-scm.com`.

Run the installer and keep the default options selected during setup.
**(Skip this Step if you already have Git)**

2. Install Node.js
Download the LTS (Long Term Support) installer from nodejs.org.

Run the installer and finish the setup.

3. Verify Installation

Open VS Code.
Open a new terminal by pressing Ctrl + ~ (or click Terminal > New Terminal in the top menu).

Verify all tools are accessible by running:
`git --version`
`node -v`
`npm -v`
**If any command says "not recognized", restart VS Code or your PC. The output should show version numbers**

## Step 2: Clone the Repository & Verify Connection

1. Open VS Code, press Ctrl + ~ to open the terminal, and navigate to the directory where you store projects (e.g., Documents or Projects):
`cd ~/Documents`

2. Clone the repository:
`git clone https://github.com/AldrianCogonon/portfolio-generator.git`

3. Enter the project directory:
`cd portfolio-generator`

4. Verify repository connection:
Run the following command to make sure your local clone is connected to the official repository:
`git remote -v`
You should see two lines pointing to 
`[https://github.com/AldrianCogonon/portfolio-generator.git](https://github.com/AldrianCogonon/portfolio-generator.git)` for both `fetch` and `push`.

## Step 3: Install Dependencies & Setup Environment

1. Install Project Packages
Run this single command inside the portfolio-generator folder:
`npm install`
This automatically downloads and configures Tailwind CSS, Supabase, and Vite inside your local `node_modules/` directory.

2. Set Up Environment Variables (.env)
In the VS Code file explorer, locate the example.env file.

Duplicate it or create a copy named .env in the root directory:
`cp example.env .env`

3. Open .env and replace the placeholder values with the project's active Supabase credentials (ask Aldrian/Team Lead for the official keys):
`VITE_SUPABASE_URL=https://your-actual-project.supabase.co`
`VITE_SUPABASE_ANON_KEY=your-actual-anon-key`

## Step 4: Create Your Feature Branch
Never work directly on `main`. Always create a dedicated branch for the task or feature you are building.

1. Create and switch to your feature branch:
`git checkout -b feature/your-name-feature-description`
Examples:
* `git checkout -b feature/john-login-form`
* `git checkout -b feature/maria-hero-section`

2. Verify your active branch:
`git branch
**The active branch will have an asterisk (`*`) next to it and be highlighted in green.**

## Step 5: Start Local Development Server
To preview your work live with hot-reloading:
`npm run dev`

* Open the local web address shown in your terminal (usually `http://localhost:5173`).
* Any changes you make to HTML, CSS, or JS files will update live in your browser.
* Press `Ctrl + C` in the terminal to stop the server when done.

## Step 6: Git Workflow & Meaningful Commit Messages
As you make changes, commit your work frequently with clear, descriptive messages detailing what was changed and why.

1. Stage Your Changes
`git add file-you-changed.html`
2. Check Staged Files
`git status`
3. Write a Meaningful Commit Message
Avoid vague messages like `"updates"`, `"fix"`, or `"done"`. Use structured, descriptive messages per component/feature:

Good Examples:.
* `git commit -m "feat(auth): implement signup form validation in account.html"`
* `git commit -m "style(index): add responsive navigation bar using Tailwind CSS"`
* `git commit -m "fix(supabase): resolve missing session check in supabase.js"`

## Step 7: Push Branch & Submit a Pull Request (PR)
Once your feature is complete and tested locally:

1. Push Your Feature Branch to GitHub
`git push -u origin feature/your-branch-name`
2. Create a Pull Request on GitHub
* Open `https://github.com/AldrianCogonon/portfolio-generator` in your browser.
* You will see a prompt saying `"Compare & pull request"` for your recently pushed branch. Click it.
* Ensure the base branch is set to `main` and the compare branch is set to `feature/your-branch-name`.