/********************************************************************************
* WEB322 – Assignment 06
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
*
* Name: JUBIN VERMA Student ID: 153629233 Date: 11/04/2025
********************************************************************************/

const express = require("express");
const path = require("path");
const projectData = require("./modules/projects");
const authData = require("./modules/auth-service");
const clientSessions = require("client-sessions");

const app = express();
const port = 3000;

/* ----------------- MIDDLEWARE SETUP ----------------- */
app.use(express.static(path.join(__dirname, "/public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.urlencoded({ extended: true }));

app.use(clientSessions({
  cookieName: "session",
  secret: "jubinvermaCrownthe3rd",
  duration: 2 * 60 * 1000,         // 2 minutes
  activeDuration: 1000 * 60        // Extend session by 1 minute
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

/* ----------------- INITIALIZE SERVICES ----------------- */
projectData.initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Initialization failed:", err);
  });

/* ----------------- ROUTES ----------------- */

// Home
app.get("/", (req, res) => {
  projectData.getAllProjects()
    .then((projects) => {
      res.render("home", { projects, showSearchBar: false });
    });
});

// About
app.get("/about", (req, res) => {
  res.render("about", { showSearchBar: false });
});

// All Projects or Filtered by Sector
app.get("/solutions/projects", async (req, res) => {
  const allProjects = await projectData.getAllProjects();
  const { sector } = req.query;

  if (sector) {
    projectData.getProjectsBySector(sector)
      .then((projects) => {
        res.render("projects", { projects, showSearchBar: true });
      })
      .catch(() => {
        res.status(404).render("404", {
          message: `No projects found for sector: ${sector}`,
          showSearchBar: false
        });
      });
  } else {
    res.render("projects", { projects: allProjects, showSearchBar: true });
  }
});

// Single Project View
app.get("/solutions/projects/:id", (req, res) => {
  const { id } = req.params;
  projectData.getProjectByID(id)
    .then((project) => {
      res.render("project", { project, showSearchBar: false });
    })
    .catch(() => {
      res.status(404).render("404", {
        message: "Unable to find requested project.",
        showSearchBar: false
      });
    });
});

// Add Project
app.get("/solutions/addProject", ensureLogin, async (req, res) => {
  const sectors = await projectData.getAllSectors();
  res.render("addProject", { sectors, showSearchBar: false });
});

app.post("/solutions/addProject", ensureLogin, (req, res) => {
  projectData.addProject(req.body)
    .then(() => res.redirect("/solutions/projects"))
    .catch((err) => {
      res.render("500", {
        message: `We're sorry, but an error occurred: ${err}`,
        showSearchBar: false
      });
    });
});

// Edit Project
app.get("/solutions/editProject/:id", ensureLogin, (req, res) => {
  const projectPromise = projectData.getProjectByID(req.params.id);
  const sectorsPromise = projectData.getAllSectors();

  Promise.allSettled([projectPromise, sectorsPromise])
    .then((results) => {
      const project = results[0].value;
      const sectors = results[1].value;
      res.render("editProject", { project, sectors, showSearchBar: false });
    })
    .catch((err) => {
      res.status(404).render("404", {
        message: err?.errors?.[0]?.message || "Error loading project",
        showSearchBar: false
      });
    });
});

app.post("/solutions/editProject", ensureLogin, (req, res) => {
  const { id } = req.body;
  projectData.editProject(id, req.body)
    .then(() => res.redirect("/solutions/projects"))
    .catch((err) => {
      res.render("500", {
        message: `We're sorry, but an error occurred: ${err}`,
        showSearchBar: false
      });
    });
});

// Delete Project
app.get("/solutions/deleteProject/:id", ensureLogin, (req, res) => {
  projectData.deleteProject(req.params.id)
    .then(() => res.redirect("/solutions/projects"))
    .catch((err) => {
      res.render("500", {
        message: `We're sorry, but an error occurred: ${err}`,
        showSearchBar: false
      });
    });
});

/* ----------------- AUTH ROUTES ----------------- */

app.get("/login", (req, res) => {
  res.render("login", { errorMessage: "", userName: "", showSearchBar: false });
});

app.get("/register", (req, res) => {
  res.render("register", {
    errorMessage: "",
    successMessage: "",
    userName: "",
    showSearchBar: false
  });
});

app.post("/register", (req, res) => {
  authData.registerUser(req.body)
    .then(() => {
      res.render("register", {
        errorMessage: "",
        successMessage: "User created",
        userName: "",
        showSearchBar: false
      });
    })
    .catch((err) => {
      res.render("register", {
        errorMessage: err,
        successMessage: "",
        userName: req.body.userName,
        showSearchBar: false
      });
    });
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");

  authData.checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      };
      res.redirect("/solutions/projects");
    })
    .catch((err) => {
      res.render("login", {
        errorMessage: err,
        userName: req.body.userName,
        showSearchBar: false
      });
    });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory", { showSearchBar: false });
});

/* ----------------- ERROR ROUTES ----------------- */

app.get("/500", (req, res) => {
  res.status(500).render("500", {
    message: "We're sorry, there might be an issue with our servers. Please check back later.",
    showSearchBar: false
  });
});

app.use((req, res) => {
  res.status(404).render("404", {
    message: "We're sorry, the page you're looking for could not be found.",
    showSearchBar: false
  });
});
