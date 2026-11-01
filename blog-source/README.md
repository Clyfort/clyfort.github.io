# ClyBio Hexo source

This folder is the source project for the ClyBio site. It uses Hexo and the official ReDefine theme, pinned to 2.9.0.

Add posts under `source/_posts/`. GitHub Actions builds this project and publishes the generated `public/` artifact to GitHub Pages. Existing images, downloads, fonts, and the image editor are copied from the repository root during the build.

To publish manually, open the repository's **Actions** tab, select **Build and deploy Hexo site**, then choose **Run workflow**. Changes pushed to `main` also trigger a build and deployment.
