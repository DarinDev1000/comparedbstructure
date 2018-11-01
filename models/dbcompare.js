const _ = require('underscore');
const ObjectCompare = require('./ObjectCompare');

class DBCompare {

  static async home(ctx) {
    await ctx.render('index.twig', {message: ctx.params.info});
  }

  static async getDatabaseTables(Databases) {
    // GET TABLES OF COMPARE DB 1
    const databaseName1 = process.env.DB_COMPARE_1_DATABASE; 
    const [db1Tables] = await global.comparedb1.query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
                                              WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA=:databaseName1 ;`,
                                              {databaseName1: databaseName1});

    // GET TABLES OF COMPARE DB 2
    const databaseName2 = process.env.DB_COMPARE_2_DATABASE;
    const [db2Tables] = await global.comparedb2.query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
                                              WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA=:databaseName2 ;`,
                                              {databaseName2: databaseName2});
    // console.log(db1Tables);
    // console.log(db2Tables);
    // console.log(typeof db1Tables);
    // console.log(typeof db2Tables);
    Databases.db1.databaseName = databaseName1;
    Databases.db2.databaseName = databaseName2;
    Databases.db1.tablesObject = db1Tables;
    Databases.db2.tablesObject = db2Tables;
  }

  static async getAllTableList(Databases, allTableSet) {
    console.log("Running getAllTableList");
    // Generate tableList1
    for (const db of Databases) {
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

  static async getTableColumns(Databases) {
    //-----------------------------------------------------
    // GET COLUMNS OF EACH TABLE
    //-----------------------------------------------------

    // GET COLUMNS OF COMPARE DB 1
    if (Databases.db1Tables[index]) {
      //const databaseName1 = process.env.DB_COMPARE_1_DATABASE;  // already done
      const tableName1 = Databases.db1Tables[index].TABLE_NAME;
      var [db1TableColumns] = await global.comparedb1.query(`SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = :tableName1 AND TABLE_SCHEMA=:databaseName1;`,
                                                {tableName1: tableName1, databaseName1: Databases.databaseName1});
      //console.log(db1TableColumns);
    }

    // GET COLUMNS OF COMPARE DB 2
    if (Databases.db2Tables[index]) {
      //const databaseName2 = process.env.DB_COMPARE_2_DATABASE;  // already done
      const tableName2 = Databases.db2Tables[index].TABLE_NAME;
      var [db2TableColumns] = await global.comparedb2.query(`SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = :tableName2 AND TABLE_SCHEMA=:databaseName2;`,
                                                {tableName2: tableName2, databaseName2: Databases.databaseName2});
      //console.log(db2TableColumns);
    }

  }

  static async compareDatabasesStart(ctx) {
    try {
      //-----------------------------------------------------
      // Compare Tables in Databases
      //-----------------------------------------------------
      console.log("\n","Compare Tables in Databases");

      // ONE WAY TO MAKE OBJECTS
      // MAKE Databases OBJECT
      const Databases = {};
      Databases.db1 = {};
      Databases.db2 = {};
      Databases.db1.databaseName = "databaseName1";
      Databases.db2.databaseName = "databaseName2";
      Databases.db1.tablesObject = ["db1Tables"];
      Databases.db2.tablesObject = ["db2Tables"];
      Databases.db1.tableList = [];
      Databases.db2.tableList = [];
      // Databases.db1.allTableSet = new Set([]);
      // Databases.db2.allTableSet = new Set([]);
      Databases.db1.Tables = {};
      Databases.db2.Tables = {};

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

      // GET TABLE LIST FROM THE DATABASE
      await DBCompare.getDatabaseTables(Databases);
      await DBCompare.getAllTableList(Databases, allTableSet);
      //console.log(Databases);

      // SET TABLE OBJECTS
      for (const t of Databases.db1.tableList) {
        Databases.db1.Tables[t] = {};
        Databases.db1.Tables[t].columnList = [];
        console.log({t});
      }
      for (const t of Databases.db2.tableList) Databases.db2.Tables[t] = {};
      console.log(Databases);

      // TRUE/FALSE : ARE THE TABLES THE SAME
      const tablesSame = await ObjectCompare.isEqual(Databases.db1.tableList, Databases.db2.tableList1) ? true : false;
      console.log({tablesSame});

      // OUTPUT THE TABLES TO HTML
      if (tablesSame) await ctx.render('dbcompare.twig', {tableSame: true, color: 'green', result1: Databases.db1Tables, result2: Databases.db2Tables, tablesSameResult: "Yes, The databases have the same tables."});
      else await ctx.render('dbcompare.twig', {tableSame: false, color: 'red', result1: Databases.db1Tables, result2: Databases.db2Tables, tablesSameResult: "NO, The databases have different tables."});

      // VIEW JSON OUTPUT ***** comment out *****
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
      console.log("\n","Compare columns in tables");









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