# CompareDBStructure

A program to compare the structure of two databases and list the differences.


  * This program compares the structure of 2 different databases.

  * It lists all tables and columns.  It only shows properties if they are different.

  * Dashes indicated that the table or column is missing or misspelled

*This program is still in development.*

## How to use

Requirements:

* Node.js and npm Installed
* 2 MariaDB/MySQL Databases to compare
* This repository downloaded

### Steps

1. Install Node.js version 8.x (this also installs npm)
    * With package manager: https://nodejs.org/en/download/package-manager/
    * Direct download: https://nodejs.org/en/#download
    * All versions: https://nodejs.org/en/download/

2. Check that node and npm are installed
    * `node -v`
    * `npm -v`

3. Download this project
    * https://github.com/DarinDev1000/comparedbstructure.git

4. Setup a database: MariaDB/MySQL
    * If you don't have a database, I suggest MariaDB
    * Mac/Linux check your package manager for MariaDB: "mariadb-server"
    * Add to package manager: https://downloads.mariadb.org/mariadb/repositories
    * Direct Download: https://mariadb.org/download/

5. You may want a database browser to view and edit databases
    * Or edit the database from the command line
    * `sudo mysql -p` or `mysql -u root -p`
    * To add a user, in mysql, run:
    * `GRANT ALL PRIVILEGES ON *.* TO '<username>'@'localhost' IDENTIFIED BY '<password>';`

6. Create 2 databases in you database server

7. In the root directory, rename the "sample.env" file to ".env"

8. In the ".env" file, fill in the information for database 1 and 2.  Use the username and password you created.

9. In the root project directory, run:
    * `sudo npm install npm@latest -g`
    * `npm install`

10. This should complete the setup. Now run the server.
    * `npm run dev`
    * This will start the server on http://localhost:3000
    * The frontend is on http://localhost:3000/dbcompare
    * To change databases, restart the server