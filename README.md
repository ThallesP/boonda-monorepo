<h1 align="center">Boonda: Quick File Sharing</h1>

Boonda is a simple website and desktop app for quick and easy temporary files sharing.  
Whether you're sending files from your phone to your laptop or sharing them with friends, Boonda makes it simple.

## ✨ Features
- **Fast Sharing**: Share files quickly without complex setup.
- **Multi-Device**: Works on both your web browser and as a desktop app.
- **Link Sharing**: Generate unique links for easy file sharing.

## 🛠️ How Boonda works

Boonda determines how long a file link stays active based on the size of the uploaded file. This calculation uses a cubic transformation:

`min_age + (-max_age + min_age) * pow((file_size / max_size - 1), 3)`

ensuring that smaller files remain accessible for longer periods, while larger files have shorter lifetimes.  
Once you've uploaded your file, Boonda generates a unique link. Share this with your recipient to give them access to your file. The link remains active for a set period.

## 🤝 How Supabase helped us
Supabase made a big difference in our project, saving us a lot of time and effort. Here's why:

**Authentication**: Setting up user authentication was straightforward with Supabase's tools.  
**Storage**: Managing file storage was simple and efficient.  
**Database**: The database setup was quick and easy to work with.

Thanks to Supabase, we reduced our development time significantly. It made complex tasks manageable and allowed us to focus on building our product.

## Credits
- [0x0.st](https://0x0.st/)
