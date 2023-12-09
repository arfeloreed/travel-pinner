import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import "dotenv/config";

// variables
const app = express();
const port = 3000;

// db setup
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "countries",
  password: process.env.DB_PASSWORD,
  port: 5432,
});
db.connect();

// helper funtions
async function countries_visited() {
  const countries = await db.query("SELECT country_code FROM visited_countries");
  return countries.rows.map((item) => item.country_code);
}

// middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// endpoint
app.get("/", async (req, res) => {
  const countryCodes = await countries_visited();

  res.render("index.ejs", {
    total: countryCodes.length,
    countries: countryCodes,
  });
});

app.post("/add", async (req, res) => {
  const country = req.body.country;

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'",
      [country.toLowerCase()]
    );
    const code = result.rows[0].country_code;

    try {
      await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [code]);

      res.redirect("/");
    } catch (error) {
      console.error(`${error.message}\n`);
      const countryCodes = await countries_visited();
      res.render("index.ejs", {
        error: `${country} already added. Try again.`,
        countries: countryCodes,
        total: countryCodes.length,
      });
    }
  } catch (error) {
    console.error(`${error.message}\n`);
    const countryCodes = await countries_visited();
    res.render("index.ejs", {
      error: `${country} does not exist. Try again.`,
      countries: countryCodes,
      total: countryCodes.length,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
