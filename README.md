# Manashjyoti Barman - Portfolio

A fully responsive, dark-themed, and modern portfolio website built with Next.js (App Router), TypeScript, and Tailwind CSS. The site is optimized for performance, SEO, and accessibility.

## 🚀 How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or above recommended)
- `npm` or `yarn`

### Steps
1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd my_resume
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📝 Where to Update Content

The current version uses placeholder data because the specific PDF content was not accessible during generation. You can easily update all content directly in `src/app/page.tsx`.

1. **Profile Data**: Open `src/app/page.tsx`. Look at the top of the file where constants like `skills`, `toolsAndLanguages`, `experiences`, `educationList`, `certifications`, `awards`, and `publication` are defined.
2. **Contact Info**: Search for `manashjyoti.barman07@gmail.com` in `src/app/page.tsx` to update email. Update phone and location similarly.
3. **Images & Downloads**:
   - Replace `public/profile.png` with your actual profile picture extracted from the PDF.
   - Replace `public/Manashjyoti_Barman_Resume.pdf` with your actual resume PDF so the download button functions properly.

## ☁️ How to Deploy to Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

### Steps
1. Push your code to a GitHub/GitLab/Bitbucket repository.
2. Log in to [Vercel](https://vercel.com/) and click **Add New** -> **Project**.
3. Import your Git repository.
4. Vercel will auto-detect Next.js. Most defaults are correct.
5. Click **Deploy**. Your site will be live and auto-updating with your `main` branch!
