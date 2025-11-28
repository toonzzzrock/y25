# y25 Main branch

## Requirements:

- MySQL 8.0 or higher
- Node.js 14 or higher
- npm 6 or higher
- Git
- Tmux (optional, for terminal multiplexing)
- Linux-based OS (for correctly developer system queries)

## Step to reproduce:

1. Clone the repository:

```bash
git clone https://github.com/toonzzzrock/y25
cd y25
```

2. Source the SQL file to set up the database:

```bash
mysql -u <your_username> -p
source path/to/sql/main.sql;
exit;
```

3. Place the .env files in each of the three directories: `admin`, `developer`, and `home-page`. Make sure to configure the database connection settings in each .env file according to your MySQL setup.

Example .env content:

```md
# MySQL Database Configuration (use production database)

MYSQL_HOST=localhost
MYSQL_USER=<your_username>
MYSQL_PASSWORD=<your_password>
MYSQL_DATABASE=Y25_DB
MYSQL_CONNECTION_LIMIT=20

# API Configuration

NEXT_PUBLIC_API_URL=http://localhost:8000
PEPPER_KEY=5171483f1412bb4b7fc262551eafdcd917b34ed85ccb9a1342c509d1f3016e61 # Example pepper key used in development
```

4. Install dependencies and run each part of the project:

For admin, developer, and users:

```bash
cd admin
npm install
npm run dev
```

```bash
cd developer
npm install
npm run dev
```

```bash
cd home-page
npm install
npm run dev
```

5. Access the applications in your web browser:

Password for admin is

- username: `NormalAdmin`
- password: `NormalAdmin1234!`

Password for developer is

- username: `NormalDev`
- password: `NormalDev1234!`

Password for normal users:

- username: `NormalUser`
- password: `NormalUser1234!`

Password for publisher users:

- username: `NormalPub`
- password: `NormalPub1234!`

## Showcase

### Admin Page:

![admin](/img/admin.png)

### Developer Page:

![dev](/img/dev.png)

### Home Page:

#### Main Page:

![home_page](/img/home_page.png)

#### Community Page:

![commu](/img/commu.png)

#### Publisher Page:

![publisher](/img/publisher.png)
