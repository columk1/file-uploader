<a name="readme-top"></a>

<h3 align="center">File Uploader</h3>
    <p align="center">
  <b><a href="https://columk-file-uploader.adaptable.app/" >columk-file-uploader.adaptable.app</a></b>
  </p>
  <p align="center">
  A cloud storage application built with Express using Prisma, Postgres, PassportJS and EJS. Hosted on Adaptable.
  </p>
</div>

<!-- ABOUT THE PROJECT -->

[![Folder Page Screenshot][folder-screenshot]](https://columk-file-uploader.adaptable.app/)

## About The Project

This was a project assignment from The Odin Project's 2024 Node course update. The brief was to create a stripped down version of Google Drive using Express and the templating engine EJS.

### Key Features
* **Folder Management**: Create, organize, and navigate folder structures with web components.
* **Sorting**: Sort items by name, size, or creation date in the main view.
* **Folder Sharing**: Share folders using a public access interface.
* **Direct File Sharing**: Generate direct download links for individual files.
* **Access Control**: Set expiration dates for shared folders and files.
* **User Feedback**: Use loading states and display popover alerts to provide clear feedback.
* **Accessibility**: An inclusive experience with support for assistive technologies and keyboard-only navigation.

### Additional Features
* **Authentication**: Secure user sessions with PassportJS and Prisma Session Store.
* **Cloud Storage Integration**: Securely manage file uploads and downloads with Supabase Storage.
* **Error Handling**: Centralized error handling middleware.
* **Performance Optimization**: Caching, bundling and compression of static assets.
* **Security**: Protected against common vulnerabilities with Helmet.
* **Form Validation**: Real-time form validation providing live feedback in forms.
* **Modular Architecture**: Application structured by feature and split into layers for modularity and maintainability.
* **Type Safety**: All backend code written in Typescript.

<details>
<summary>Personal Note</summary>
I found the Express/EJS stack quite limiting in this project. Although the app worked great locally, when deployed, the UX of waiting for server responses during navigation events was pretty awful. (Like many of these hobby full-stack projects, it's deployed on a free-tier with slow response times and no choice over the server and database location.) Ultimately, I ended up hacking an event handler to display a spinner on all navigation to make up for this.

Express/EJS isn't an ideal stack for a highly interactive app unless you want to go completely overboard with client-side scripting and create a mini-SPA out of the main view template. The frontend wasn't the focus of this project, but if I could go back I would create a REST API with a separate React frontend. (HTMX would have worked well too.)
</details>

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running follow these steps.

### Prerequisites

#### 1. **Database Setup:** 
Set up a local PostgreSQL database using one of the following methods:

- **Option A:** Use `psql` to create the database manually.
- **Option B:** Use the included Docker Compose file:

  ```sh
  docker-compose up
  ```

#### 2. **Supabase Setup:** 
Create a project and set up a private storage bucket on [Supabase](https://supabase.com/).

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/columk1/file-uploader.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Set up .env file
   ```
   PORT=
   DATABASE_URL=
   SESSION_SECRET=

   SUPABASE_URL=
   SUPABASE_SERVICE_ROLE_KEY=
   SUPABASE_BUCKET=
   ```
4. Migrate the database
   ```sh
   npx prisma db push
   ```
5. Bundle static assets
   ```sh
   npm run bundle
   ```
5. Start the development server
   ```sh
   npm run dev
   ```

<!-- ROADMAP -->

## Roadmap

- [ ] Create unit tests, integration tests and snapshots using Vitest

<!-- CONTACT -->

## Contact

Email: columk1@gmail.com  
Twitter: [@ColumKelly3](https://twitter.com/ColumKelly3)  
Website: [columkelly.com](https://columkelly.com)

Live Project Link: [columk-file-uploader.adaptable.app](https://columk-file-uploader.adaptable.app/)

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/linkedin_username
[folder-screenshot]: screenshots/folder-view.png
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
