const _ = require('underscore');
const ObjectCompare = require('./ObjectCompare');

class DBCompare {

  static async home(ctx) {
    await ctx.render('index.twig', {message: ctx.params.info});
  }

  static async isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

  static async getDatabaseInfo(Databases) {
    // GET DATABASE INFO
    console.log("Running getDatabaseInfo");
    // LOOP THROUGH BOTH DATABASES
    for (const key in Databases) {
      const db = Databases[key];
      try {
        //  const [dbInfo] = await db.connection.query(`select * from sys.databases;`);
        // const [dbInfo] = await db.connection.query(`DESCRIBE anotherTable;`);
        // const [dbInfo] = await db.connection.query(`SHOW CREATE DATABASE :databaseName;`, {databaseName: db.databaseName});
        const [[dbInfo]] = await db.connection.query(`SELECT * FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME=:databaseName;`, {databaseName: db.databaseName});
        //console.log(dbInfo);
        db.dbInfo = dbInfo;

      } catch (error) {
        console.log(`DATABASE_NAME error.  Is object undefined?`);
        throw {"message": `DATABASE_NAME error. Is object undefined?`, "error": error};
      }
    }
  }

  static async getDatabaseTables(Databases) {
    // GET DATABASE TABLES
    console.log("Running getDatabaseTables");
    for (const key in Databases) {
      const db = Databases[key];
      try {
        // GET TABLES OF COMPARE DB
        const [dbTables] = await db.connection.query(`SELECT * FROM INFORMATION_SCHEMA.TABLES 
                                              WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA=:databaseName;`,
                                              {databaseName: db.databaseName});
        //console.log(dbTables);
        db.tablesObject = dbTables;

      } catch (error) {
        console.log(`error.  Is object undefined?`);
      }
    }
  }

  static async getDatabaseColumns(Databases) {
     //-----------------------------------------------------
    // GET COLUMNS OF EACH TABLE
    //-----------------------------------------------------
    console.log("Running getDatabaseColumns");
    for (const key in Databases) {
      const db = Databases[key];
      console.log(db.tablesObject.length);
      for (let index = 0; index < db.tablesObject.length; index++) {
        try {
          const tableName = db.tablesObject[index].TABLE_NAME;
          // GET COLUMNS OF COMPARE DB
          const [dbColumns] = await db.connection.query(`SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                                                WHERE TABLE_SCHEMA=:databaseName AND TABLE_NAME=:tableName;`,
                                                {databaseName: db.databaseName, tableName: tableName});
          //console.log(dbColumns);
          db.Tables[tableName] = dbColumns;

        } catch (error) {
          console.log(`error.  Is object undefined?`);
        }
      }
    }
  }

  static async getAllTableList(Databases, allTableSet) {
    // Probably don't need this
    console.log("Running getAllTableList");
    // Generate tableList1
    for (const key in Databases) {
      const db = Databases[key];
      for (let index = 0; index < db.tablesObject.length; index++) {
        try {
          // console.log(db1Tables[index]);
          // console.log(db1Tables[index].TABLE_NAME);
          const tableName = db.tablesObject[index].TABLE_NAME;
          db.tableList.push(tableName);
          allTableSet.add(tableName);
        } catch (error) {
          console.log(`TABLE_NAME error for ${db.tablesObject[index].TABLE_NAME}.  Is object undefined?`);
        }
        // if ( (db1Tables[index] && db1Tables[index].TABLE_NAME) === (db2Tables[index] && db2Tables[index].TABLE_NAME) ) {
        //   console.log("same");
        // } else console.log("different");
      }
    }


    // Generate tableList2
    // for (let index = 0; index < Databases.db2.tablesObject.length; index++) {
    //   try {
    //     const tableName = Databases.db2.tablesObject[index].TABLE_NAME
    //     Databases.db2.tableList.push(tableName);
    //     allTableSet.add(tableName);
    //     console.log(tableName);
    //     console.log(allTableSet);
    //   } catch (error) {
    //     console.log("TABLE_NAME error.  Is object undefined?");
    //   }
    // }
    // SORTING IS NOT NECESSARY. THE DATABASE IF ALPHABETICAL BY DEFAULT.
    Databases.db1.tableList.sort();
    Databases.db2.tableList.sort();
    // allTableSet.sort;
    // console.log(Tables.tableList1);
    // console.log(Tables.tableList2);
    console.log(allTableSet);

    // COPY Databases.db1.allTableSet TO DB2
    //Databases.db2.allTableSet = Databases.db1.allTableSet;
  }

  static async compareDatabaseInfo(Databases) {
    console.log("\nCompare Database Info Start");
    // Only list the differences
    const DatabaseDiff = {db1: {}, db2: {}};
    let DatabaseInfoSame = false;

    if (Databases.db1.dbInfo.DEFAULT_CHARACTER_SET_NAME !== Databases.db2.dbInfo.DEFAULT_CHARACTER_SET_NAME) {
      DatabaseDiff.db1.DEFAULT_CHARACTER_SET_NAME = Databases.db1.dbInfo.DEFAULT_CHARACTER_SET_NAME;
      DatabaseDiff.db2.DEFAULT_CHARACTER_SET_NAME = Databases.db2.dbInfo.DEFAULT_CHARACTER_SET_NAME;
    }

    if (Databases.db1.dbInfo.DEFAULT_COLLATION_NAME !== Databases.db2.dbInfo.DEFAULT_COLLATION_NAME) {
      DatabaseDiff.db1.DEFAULT_COLLATION_NAME = Databases.db1.dbInfo.DEFAULT_COLLATION_NAME;
      DatabaseDiff.db2.DEFAULT_COLLATION_NAME = Databases.db2.dbInfo.DEFAULT_COLLATION_NAME;
    }

    if (DBCompare.isEmpty(DatabaseDiff)) {
      // console.log(DatabaseDiff);
      DatabaseInfoSame = true;
      console.log("Database Info is the same");
    } else {
      console.log(DatabaseDiff);
    }
    const returnArray = [DatabaseInfoSame, DatabaseDiff];
    return returnArray;
  }

  // Compare Tables and table properties
  static async compareTables(Databases) {
    console.log("\nCompare Tables Start");
    // Only list the differences
    const tablePropertiesToCompare = [ "TABLE_NAME",
                                  "TABLE_TYPE",
                                  "ENGINE",
                                  "VERSION",
                                  "ROW_FORMAT",
                                  "TABLE_ROWS",
                                  "TABLE_COLLATION",
                                  "CREATE_OPTIONS",
                                  "TEMPORARY"];
    const TableDiff = {};
    TableDiff.db1 = {};
    TableDiff.db2 = {};
    const sameTableList = [];
    let lastKey = 0;

    // LOOP TABLES IN DB1
    for (const key in Databases.db1.tablesObject) {
      if (Databases.db1.tablesObject.hasOwnProperty(key)) {
        const dbTable_A = Databases.db1.tablesObject[key];
        //console.log(dbTable_A);
        lastKey = key;

        // GET DB1 TABLE NAME
        const tableName = dbTable_A.TABLE_NAME;
        console.log(tableName);


        // CHECK IF TABLE IN DB2 and assign to dbTable_B
        let tableInBothDB = false;
        let dbTable_B = {};
        for (const key2 in Databases.db2.tablesObject) {
          if (Databases.db2.tablesObject.hasOwnProperty(key2)) {
            const element = Databases.db2.tablesObject[key2];
            if (tableName === element.TABLE_NAME) {
              tableInBothDB = true;
              dbTable_B = element;
              sameTableList.push(tableName);
              console.log("sameTableList", sameTableList);
              console.log(`Table (${tableName}) exist in both databases`);
              break;
            }
          }
        }

        // If table in both databases, check properties
        console.log(`Starting table properties compare`);
        console.log(`tableInBothDB: ${tableInBothDB}`);
        if (tableInBothDB === true) {
          // Loop through table properties
          for (const property of tablePropertiesToCompare) {
            console.log(`Comparing (${property}) property`);

            console.log(dbTable_A[property]);
            console.log(dbTable_B[property]);
            // Add property to object if they are different
            if (dbTable_A[property] !== dbTable_B[property]) {
              console.log(`(${dbTable_A[property]}) is not the same`);
              TableDiff.db1[key] = {};
              TableDiff.db2[key] = {};
              TableDiff.db1[key].TABLE_NAME = tableName;
              TableDiff.db2[key].TABLE_NAME = dbTable_B.TABLE_NAME;
              TableDiff.db1[key].properties = {};
              TableDiff.db2[key].properties = {};
              // TableDiff.db1[key][tableName] = {};
              // TableDiff.db2[key][dbTable_B.TABLE_NAME] = {};
              TableDiff.db1[key].properties[property] = dbTable_A[property];
              TableDiff.db2[key].properties[property] = dbTable_B[property];
              TableDiff.db1[key].columns = {};
              TableDiff.db2[key].columns = {};
            }
          }

          const ColumnDiff = await DBCompare.compareColumns(Databases, tableName);
          // Databases.ColumnDiff = ColumnDiff;


        } else {  // TABLE IS NOT IN DB2
          console.log(`Table (${tableName} does NOT exist in db2)`);
          TableDiff.db1[key] = {};
          TableDiff.db2[key] = {};
          TableDiff.db1[key].TABLE_NAME = tableName;
          TableDiff.db2[key].TABLE_NAME = "undefined";
          // TableDiff.db1[key][tableName] = {};
          // TableDiff.db2[key][dbTable_B.TABLE_NAME] = {};

        }
      }
    } // end LOOP TABLES IN DB1


    // LOOP TABLES IN DB2 - Add extra tables
    console.log("\nAdd extra tables in db2 to list");
    console.log("sameTableList", sameTableList);
    for (const key in Databases.db2.tablesObject) {
      if (Databases.db2.tablesObject.hasOwnProperty(key)) {
        const dbTable_B = Databases.db2.tablesObject[key];
        //console.log(dbTable_B);

        // GET DB2 TABLE NAME
        const tableName_2 = dbTable_B.TABLE_NAME;
        console.log("tableName_2", tableName_2);

        // Check if table is in DB1 
        let tableInBothDB = false;
        for (const tableAName of sameTableList) {
          // console.log("tableAName", tableAName);
          if (tableAName === tableName_2) {
            tableInBothDB = true;
            console.log("Table already listed. Go to next");
            break;
          }
        }
        // If table is only in db2, add to list
        if (tableInBothDB === false) {
          console.log("Table is not found. Add to TableDiff object");
          // TABLE IS NOT IN DB1
          console.log(`Table (${tableName_2} does NOT exist in db1)`);
          lastKey++;

          TableDiff.db1[lastKey] = {};
          TableDiff.db2[lastKey] = {};
          TableDiff.db1[lastKey].TABLE_NAME = "undefined";
          TableDiff.db2[lastKey].TABLE_NAME = tableName_2;
        //   TableDiff.db1[lastKey].undefined = {};
        //   TableDiff.db2[lastKey][tableName_2] = {};
        }
        
      }
    } // end LOOP TABLES IN DB2

    return TableDiff;
  }

  static async compareColumns(Databases, tableName) {
    console.log("\nCompare Columns Start");
    // Only list the differences
    const columnPropertiesToCompare = [ "TABLE_NAME",
                                    "COLUMN_NAME",
                                    "COLUMN_DEFAULT",
                                    "IS_NULLABLE",
                                    /*
                                    "DATA_TYPE": "int",
                                    "CHARACTER_MAXIMUM_LENGTH": null,
                                    "CHARACTER_OCTET_LENGTH": null,
                                    "NUMERIC_PRECISION": 10,
                                    "NUMERIC_SCALE": 0,
                                    "DATETIME_PRECISION": null,
                                    "CHARACTER_SET_NAME": null,
                                    */
                                    "COLLATION_NAME",
                                    "COLUMN_TYPE",
                                    "COLUMN_KEY",
                                    "EXTRA",
                                    "PRIVILEGES",
                                    "COLUMN_COMMENT"];
    const ColumnDiff = {};
    const dbTable_A = Databases.db1.Tables;
    const dbTable_B = Databases.db2.Tables;

    // LOOP COLUMNS IN TABLE
    for (const columnKey_X in dbTable_A) {
      if (dbTable_A.hasOwnProperty(columnKey_X)) {
        const dbColumn_X = dbTable_A[columnKey_X];
        // console.log(dbColumn_X);

        // TODO:  Continue
      }
    }
    return ColumnDiff;
  }


  static async compareDatabasesStart(ctx) {
    try {
      //-----------------------------------------------------
      // Get Info in Databases
      //-----------------------------------------------------
      console.log("Compare Tables in Databases");

      // ONE WAY TO MAKE OBJECTS
      // MAKE Databases OBJECT
      const Databases = {};
      Databases.db1 = {};
      Databases.db2 = {};
      Databases.db1.databaseName = process.env.DB_COMPARE_1_DATABASE;
      Databases.db2.databaseName = process.env.DB_COMPARE_2_DATABASE;
      Databases.db1.connection = global.comparedb1;
      Databases.db2.connection = global.comparedb2;
      Databases.db1.dbInfo = {};
      Databases.db2.dbInfo = {};
      Databases.db1.tableList = [];
      Databases.db2.tableList = [];
      Databases.db1.tablesObject = ["db1Tables"];
      Databases.db2.tablesObject = ["db2Tables"];
      // Databases.db1.allTableSet = new Set([]);
      // Databases.db2.allTableSet = new Set([]);
      Databases.db1.Tables = {};
      Databases.db2.Tables = {};

      const DBDiff = {}

      const allTableSet = new Set();


      /* // moved to Databases object
      // ANOTHER WAY TO MAKE OBJECTS
      // MAKE Tables OBJECT
      var Tables = {
        tableList1: [],
        tableList2: [],
        allTableSet: new Set([])
      };
      */

      // GET DATABASE INFO
      await DBCompare.getDatabaseInfo(Databases);
      
      // GET TABLE LIST FROM THE DATABASE
      await DBCompare.getDatabaseTables(Databases);
      await DBCompare.getAllTableList(Databases, allTableSet);

      // SET TABLE OBJECTS
      for (const t of Databases.db1.tableList) Databases.db1.Tables[t] = {};
      for (const t of Databases.db2.tableList) Databases.db2.Tables[t] = {};

      // GET TABLE COLUMNS
      await DBCompare.getDatabaseColumns(Databases);

      // TRUE/FALSE : ARE THE TABLES THE SAME
      const tablesSame = await ObjectCompare.isEqual(Databases.db1.tableList, Databases.db2.tableList1) ? true : false;
      console.log(`Are the tables the same: ${tablesSame}`);
      //console.log({tablesSame});

      // OUTPUT THE TABLES TO HTML
      if (tablesSame) await ctx.render('dbcompare.twig', {tableSame: true, color: 'green', result1: Databases.db1Tables, result2: Databases.db2Tables, tablesSameResult: "Yes, The databases have the same tables."});
      else await ctx.render('dbcompare.twig', {tableSame: false, color: 'red', result1: Databases.db1Tables, result2: Databases.db2Tables, tablesSameResult: "NO, The databases have different tables."});



      //-----------------------------------------------------
      // Compare Databases  TODO:
      //-----------------------------------------------------

      const returnArrayDatabaseInfoDiff = await DBCompare.compareDatabaseInfo(Databases);
      DBDiff.DatabaseInfoSame = returnArrayDatabaseInfoDiff[0];
      DBDiff.DatabaseInfoDiff = returnArrayDatabaseInfoDiff[1];
      //-----------------------------------------------------
      // Compare Tables  TODO:
      //-----------------------------------------------------

      DBDiff.TableDiff = await DBCompare.compareTables(Databases);



      // VIEW JSON OUTPUT ***** comment out *****
      //console.log(Databases);
      delete Databases.db1.connection;
      delete Databases.db2.connection;
      
      // ctx.body = TableDiff;
      Databases.DBDiff = DBDiff;
      ctx.body = Databases;


      

      












      /*
      // ------ USING isEqual library -------
      // Object evaluation does not work intuitively like other expressions.
      // Uses underscore library to compare objects
      // Alternative version to converting to string
      console.log(_.isEqual(Databases.db1Tables, Databases.db2Tables));
      if ( _.isEqual(Databases.db1Tables, Databases.db2Tables) ){
        console.log("Tables are same");
        await ctx.render('dbcompare.twig', {tableSame: true, color: 'green', result1: Databases.db1Tables, result2: Databases.db2Tables, tablesSameResult: "Yes, The databases have the same tables."});
      } else {
        console.log("Tables are NOT the same");
        await ctx.render('dbcompare.twig', {tableSame: false, color: 'red', result1: Databases.db1Tables, result2: Databases.db2Tables, tablesSameResult: "NO, The databases have different tables."});
      }
      */
      
      

      //-----------------------------------------------------
      // Compare columns in tables
      //-----------------------------------------------------
      //console.log("\n","Compare columns in tables");









      // // Converts object to string to compare equality.
      // for (let index = 0; index < Databases.db1.tablesObject.length; index++) {
      //   try {
      //     //console.log(db1Tables[index]);
      //     console.log(Databases.db1Tables[index].TABLE_NAME);
      //     //console.log(db2Tables[index]);
      //     console.log(Databases.db2Tables[index].TABLE_NAME);
      //   } catch (error) {
      //     console.log("TABLE_NAME error.  Is object undefined?");
      //   }
        
      //   if ( (Databases.db1Tables[index] && Databases.db1Tables[index].TABLE_NAME) === (Databases.db2Tables[index] && Databases.db2Tables[index].TABLE_NAME) ) {
      //     console.log("same");

      //     //-----------------------------------------------------
      //     // GET COLUMNS OF EACH TABLE
      //     //-----------------------------------------------------

      //     // GET COLUMNS OF COMPARE DB 1
      //     if (Databases.db1Tables[index]) {
      //       //const databaseName1 = process.env.DB_COMPARE_1_DATABASE;  // already done
      //       const tableName1 = Databases.db1Tables[index].TABLE_NAME;
      //       var [db1TableColumns] = await global.comparedb1.query(`SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = :tableName1 AND TABLE_SCHEMA=:databaseName1;`,
      //                                                 {tableName1: tableName1, databaseName1: Databases.db1.databaseName});
      //       //console.log(db1TableColumns);
      //     }

      //     // GET COLUMNS OF COMPARE DB 2
      //     if (Databases.db2Tables[index]) {
      //       //const databaseName2 = process.env.DB_COMPARE_2_DATABASE;  // already done
      //       const tableName2 = Databases.db2Tables[index].TABLE_NAME;
      //       var [db2TableColumns] = await global.comparedb2.query(`SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = :tableName2 AND TABLE_SCHEMA=:databaseName2;`,
      //                                                 {tableName2: tableName2, databaseName2: Databases.db2.databaseName});
      //       //console.log(db2TableColumns);
      //     }

      //     if ( _.isEqual(db1TableColumns, db2TableColumns) ){
      //       console.log("Columns are same");
      //     } else {
      //       console.log("Columns are NOT the same");
      //     }
          
      //     // for (let col = 0; col < db1TableColumns.length; col++) {
      //     //   console.log(db1TableColumns[col]);
      //     // }

      //   } else 
      //   console.log("different");
      
      // }






      
      //ctx.body = results;  // return the result as the body
      // await ctx.render('dbcompare.twig', {results: results});
      // console.log(results);
    } catch (e) {
      console.log(e);
      throw e;
    }
  } // end compareDatabasesStart


}

module.exports = DBCompare;