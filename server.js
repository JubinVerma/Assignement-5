/********************************************************************************
* WEB322 – Assignment 05
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
*
* Name: JUBIN VERMA Student ID: 153629233 Date: 27/03/2025
********************************************************************************/

require("dotenv").config();
const Sequelize = require('sequelize');

const express = require('express');
const path = require('path');
const projectData = require('./modules/projects');
const app = express();
const port = 3000;

async function findSector(value) {
  let sector = []; 
  sector = await projectData.getProjectsBySector(value);

  return sector;
}

async function getID(id) {
  let project = [];
  project = await projectData.getProjectByID(id);
  return project;
}

Sequelize.sync();


app.use(express.static("public"));
app.set('view engine', 'ejs'); 
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));

app.use(express.urlencoded({ extended: true }));


projectData.initialize().then(() => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}).catch(err => {
    console.error('Failed to initialize data:', err);
});


app.get("/", (req, res) => {
    res.render("home", {showSearchBar: false});
});


app.get("/about", (req, res) => {
    res.render("about", {showSearchBar: false});
});


app.get("/solutions/projects", async (req, res) => {
    let projects = await projectData.getAllProjects();
let { sector } = req.query;

  if (sector) {
    findSector(sector)
      .then((data) => {
        res.render("projects", {projects:data, showSearchBar:true});
      })
      .catch(() => {
        res.status(404).render("404", {message: `No projects found for sector: ${sector}`, showSearchBar:false});
      });
  } else {
    res.render("projects", {projects: projects, showSearchBar: true});
  }
});


app.get("/solutions/projects/:id", async (req, res) => {
    let { id } = req.params;
    if (id) {
      getID(id)
        .then((data) => {
          res.render("project", {project:data, showSearchBar:false});
        })
        .catch(() => {
          res.status(404).render("404", {message: "Unable to find request project.", showSearchBar:false});
        });
    }
});




/////////////////////assignement 5 new additions


app.get('/solutions/addProject', (req, res) => {
  projectData.getAllSectors()
      .then(sectors => {
          res.render('addProject', { sectors: sectors });
      })
      .catch(err => {
          console.error("Error fetching sectors:", err);
          res.status(500).render('500', { message: "Internal server error." });
      });
});

app.post('/solutions/addProject', (req, res) => {
  const newProjectData = {
      title: req.body.title,
      feature_img_url: req.body.feature_img_url,
      sector_id: req.body.sector_id,
      intro_short: req.body.intro_short,
      summary_short: req.body.summary_short,
      impact: req.body.impact,
      original_source_url: req.body.original_source_url
  };

  projectData.addProject(newProjectData)
      .then(() => {
          res.redirect('/solutions/projects');
      })
      .catch(err => {
          console.error("Error adding project:", err);
          res.status(500).render('500', { message: "Internal server error." });
      });
});

app.get('/solutions/editProject/:id', (req, res) => {
  const projectId = parseInt(req.params.id);

  Promise.all([projectData.getProjectById(projectId), projectData.getAllSectors()])
      .then(([project, sectors]) => {
          res.render('editProject', { project: project, sectors: sectors });
      })
      .catch(err => {
          console.error("Error fetching project or sectors:", err);
          res.status(500).render('500', { message: "Internal server error." });
      });
});

// Add a route to update a project based on the project ID and in case of error, display a 500 error page 
app.post('/solutions/editProject', (req, res) => {
  const projectId = req.body.id;
  const updatedProjectData = {
      title: req.body.title,
      feature_img_url: req.body.feature_img_url,
      sector_id: req.body.sector_id,
      intro_short: req.body.intro_short,
      summary_short: req.body.summary_short,
      impact: req.body.impact,
      original_source_url: req.body.original_source_url
  };

  projectData.editProject(projectId, updatedProjectData)
      .then(() => {
          res.redirect('/solutions/projects');
      })
      .catch(err => {
          console.error("Error updating project:", err);
          res.status(500).render('500', { message: "Internal server error." });
      });
});

app.get('/solutions/deleteProject/:id', (req, res) => {
  const projectId = parseInt(req.params.id);

  projectData.deleteProject(projectId)
      .then(() => {
          res.redirect('/solutions/projects');
      })
      .catch(err => {
          console.error("Error deleting project:", err);
          res.status(500).render('500', { message: "Internal server error." });
      });
});

app.get("/500", (req, res) => {
  res.status(500).render('500', { message: "I'm sorry, there might be an issue with our servers. Please check back later.", showSearchBar: false });
});



app.use((req, res) => {
  res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for", showSearchBar:false});
});