const _ = require('underscore');

class DBCompare {

  static async home(ctx) {
    await ctx.render('index.twig', {message: ctx.params.info});
  }

  static async compareDatabasesStart(ctx) {
    try {
      //-----------------------------------------------------
      // Compare Tables in Databases
      //-----------------------------------------------------
      console.log("\n","Compare Tables in Databases");


      // GET TABLES OF COMPARE DB 1
      // const database = ctx.params.database;
      const databaseName1 = process.env.DB_COMPARE_1_DATABASE;
      const [db1Tables] = await global.comparedb1.query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
                                                WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA=:databaseName1 ;`,
                                                {databaseName1: databaseName1});

      // GET TABLES OF COMPARE DB 2
      const databaseName2 = process.env.DB_COMPARE_2_DATABASE;
      const [db2Tables] = await global.comparedb2.query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
                                                WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA=:databaseName2 ;`,
                                                {databaseName2: databaseName2});
      console.log(db1Tables);
      console.log(db2Tables);
      // console.log(typeof db1Tables);
      // console.log(typeof db2Tables);


      // Compares the table names
      for (let index = 0; index < db1Tables.length; index++) {
        try {
          console.log(db1Tables[index]);
          console.log(db1Tables[index].TABLE_NAME);
          console.log(db2Tables[index]);
          console.log(db2Tables[index].TABLE_NAME);
        } catch (error) {
          console.log("TABLE_NAME error.  Is object undefined?");
        }
        
        if ( (db1Tables[index] && db1Tables[index].TABLE_NAME) === (db2Tables[index] && db2Tables[index].TABLE_NAME) ) {
          console.log("same");
        } else 
        console.log("different");
        
      }

      // Object evaluation does not work intuitively like other expressions.
      // Uses underscore library to compare objects
      // Alternative version to converting to string
      console.log(_.isEqual(db1Tables, db2Tables));
      if ( _.isEqual(db1Tables, db2Tables) ){
        console.log("Tables are same");
        await ctx.render('dbcompare.twig', {tableSame: true, color: 'green', result1: db1Tables, result2: db2Tables, tablesSameResult: "Yes, The databases have the same tables."});
      } else {
        console.log("Tables are NOT the same");
        await ctx.render('dbcompare.twig', {tableSame: false, color: 'red', result1: db1Tables, result2: db2Tables, tablesSameResult: "NO, The databases have different tables."});
      }
      
      

      //-----------------------------------------------------
      // Compare columns in tables
      //-----------------------------------------------------
      console.log("\n","Compare columns in tables");

      // Converts object to string to compare equality.
      for (let index = 0; index < db1Tables.length; index++) {
        try {
          //console.log(db1Tables[index]);
          console.log(db1Tables[index].TABLE_NAME);
          //console.log(db2Tables[index]);
          console.log(db2Tables[index].TABLE_NAME);
        } catch (error) {
          console.log("TABLE_NAME error.  Is object undefined?");
        }
        
        if ( (db1Tables[index] && db1Tables[index].TABLE_NAME) === (db2Tables[index] && db2Tables[index].TABLE_NAME) ) {
          console.log("same");

          //-----------------------------------------------------
          // GET COLUMNS OF EACH TABLE
          //-----------------------------------------------------

          // GET COLUMNS OF COMPARE DB 1
          if (db1Tables[index]) {
            //const databaseName1 = process.env.DB_COMPARE_1_DATABASE;  // already done
            const tableName1 = db1Tables[index].TABLE_NAME;
            var [db1TableColumns] = await global.comparedb1.query(`SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = :tableName1 AND TABLE_SCHEMA=:databaseName1;`,
                                                      {tableName1: tableName1, databaseName1: databaseName1});
            console.log(db1TableColumns);
          }

          // GET COLUMNS OF COMPARE DB 2
          if (db2Tables[index]) {
            //const databaseName2 = process.env.DB_COMPARE_2_DATABASE;  // already done
            const tableName2 = db2Tables[index].TABLE_NAME;
            var [db2TableColumns] = await global.comparedb2.query(`SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = :tableName2 AND TABLE_SCHEMA=:databaseName2;`,
                                                      {tableName2: tableName2, databaseName2: databaseName2});
            console.log(db2TableColumns);
          }

          if ( _.isEqual(db1TableColumns, db2TableColumns) ){
            console.log("Columns are same");
          } else {
            console.log("Columns are NOT the same");
          }
          
          // for (let col = 0; col < db1TableColumns.length; col++) {
          //   console.log(db1TableColumns[col]);
          // }

        } else 
        console.log("different");
      
      }






      
      //ctx.body = results;  // return the result as the body
      // await ctx.render('dbcompare.twig', {results: results});
      // console.log(results);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}

module.exports = DBCompare;