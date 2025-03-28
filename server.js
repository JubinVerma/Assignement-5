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


app.get("/",  (req, res) => {
  const response =  projectData.getAllProjects();

  response.then((data) => {
    res.render("home", {projects: data,showSearchBar: true});
  })

});

app.get("/about", (req, res) => {
    res.render("about", {showSearchBar: false});
});


  // query values
  app.get("/solutions/projects", async (req, res) => 
    {
        const collection = await projectData.getAllProjects();
    
        let { sector } = req.query;
    
        if (sector) {
          projectData.getProjectsBySector(sector)
            .then((data) => {
              res.render("projects", {projects:data, showSearchBar:true});
            })
            .catch(() => {
              res.status(404).render("404", {message: `No projects found for sector: ${sector}`, showSearchBar:false});
            });
        } else {
          res.render("projects", {projects: collection, showSearchBar: true});
        }
    });
    


    app.get("/solutions/projects/:id", (req, res) => {
      let { id } = req.params;
      if (id) 
        {
        projectData.getProjectByID(id)
          .then((data) => {
            res.render("project", {project:data, showSearchBar:false});
          })
          .catch(() => {
            res.status(404).render("404", {message: "Unable to find request project.", showSearchBar:false});
          });
      }
    });



/////////////////////assignement 5 new additions

app.get("/solutions/addProject", async (req, res) => {
  const sectorJSON = await projectData.getAllSectors();
  res.render("addProject", {sectors: sectorJSON, showSearchBar: false});
});

app.post("/solutions/addProject", (req, res) => 
{
  const response = projectData.addProject(req.body);
  
  response.then(() => {
    res.redirect('/solutions/projects');
  }).catch((err) => {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  })
})

app.get("/solutions/editProject/:id", (req, res) => {
    const projectJSON = projectData.getProjectByID(req.params.id);
    const sectorJSON = projectData.getAllSectors();

    // check if both resolves
    Promise.allSettled([projectJSON, sectorJSON])
      .then((source) => {
        const projectData = source.map(promise => promise.value)[0];
        const sectorData = source.map(promise => promise.value)[1];
        res.render("editProject", { sectors: sectorData, project: projectData, showSearchBar:false });

      })
      .catch((err) => {
        res.status(404).render("404", { message: err.errors[0].message });
      })
});


app.post("/solutions/editProject", (req,res) => 
{
  const id = req.body.id;
  const data = req.body;

  const response = projectData.editProject(id, data);
  response.then(() => {
    console.log("Successfully edited Project " + data.title);
    res.redirect('/solutions/projects');
  }).catch((err) => {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` , showSearchBar: false});
  })
});

app.get("/solutions/deleteProject/:id", (req,res) => {
    const response = projectData.deleteProject(req.params.id);

    response.then(() => {
      console.log("delete project successfully");
      res.redirect("/solutions/projects");
    }).catch((err) => {
      res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` , showSearchBar: false });
    })
})


app.get("/500", (req, res) => {
  res.status(500).render('500', { message: "I'm sorry, there might be an issue with our servers. Please check back later.", showSearchBar: false });
});



app.use((req, res) => {
  res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for", showSearchBar:false});
});