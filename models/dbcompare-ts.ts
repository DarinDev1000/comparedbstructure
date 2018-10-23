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

      // GET TABLES OF COMPARE DB
      // const database = ctx.params.database;
      const databaseName1 = process.env.DB_COMPARE_1_DATABASE;
      const [db1Tables] = await global.comparedb1.query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
                                                WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA=:databaseName1 ;`,
                                                {databaseName1: databaseName1});

      // GET TABLES OF COMPARE DB 1
      const databaseName2 = process.env.DB_COMPARE_2_DATABASE;
      const [db2Tables] = await global.comparedb2.query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
                                                WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA=:databaseName2 ;`,
                                                {databaseName2: databaseName2});
      console.log(db1Tables);
      console.log(db2Tables);
      console.log(typeof db1Tables);
      console.log(typeof db2Tables);


      // Converts object to string to compare equality.
      // --------- THIS DOES NOT WORK CORRECTLY -------- only counts number of tables
      for (let index = 0; index < db1Tables.length; index++) {
        console.log(db1Tables[index]);
        console.log(db2Tables[index]);
        if (String(db1Tables[index]) === String(db2Tables[index])) {
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

      // Converts object to string to compare equality.
      for (let index = 0; index < db1Tables.length; index++) {
        console.log(db1Tables[index]);
        console.log(db2Tables[index]);
        if (String(db1Tables[index]) === String(db2Tables[index])) {
          console.log("same");
        } else 
        console.log("different");
        let i = 0;
      
      }

      console.log(typeof db1Tables[0]);
      const row1 = db1Tables[0];
      console.log(row1.TABLE_NAME);





      
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