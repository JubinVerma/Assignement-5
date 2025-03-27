//This will allow us to access the value of PG_CONNECTION_STRING from the ".env" file 
require('dotenv').config();
require('pg');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
});
//adding he two required models for the project and sector
const Sector = sequelize.define('Sector', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    sector_name: Sequelize.STRING,
}, { updatedAt: false , createdAt: false });

// Project model
const Project = sequelize.define('Project', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    sector_id: { type: Sequelize.INTEGER },
    title: Sequelize.STRING,
    feature_img_url: Sequelize.STRING,
    summary_short: Sequelize.TEXT,
    intro_short: Sequelize.TEXT,
    impact: Sequelize.TEXT,
    original_source_url: Sequelize.STRING,
}, { updatedAt: false , createdAt: false });

// adding the association between the two models  
Project.belongsTo(Sector, { foreignKey: 'sector_id' });

// adding the data using bulkinsert that was inserted at the bottom of this file once he data was inserted
// the bulkinsert was removed

// changing the initialize function to sync the database using sequelize.sync() function and then  using try and catch to handle the error
const initialize = () => {
    return sequelize.sync()
        .then(() => console.log('Database initialized successfully.'))
        .catch(err => {
            console.error('Error initializing database:', err);
            throw err;
        });
};

// changing the code to get all the projects from the database using findAll() function
// and then using include to include the sector model
const getAllProjects = () => {
    return Project.findAll({ include: [Sector] });
};

// changing the code to get the project by id from the database using findOne() function
const getProjectById = (projectId) => {
    return Project.findOne({ where: { id: projectId }, include: [Sector] })
};


// changing the code to get the projects by sector from the database using findAll() function
// and then using include to include the sector model
const getProjectsBySector = (sector) => {
    return Project.findAll({include: [Sector], where: { 
        '$Sector.sector_name$': { 
          [Sequelize.Op.iLike]: `%${sector}%` 
        }
      }
    })
    .then((projects) => {
      if (projects.length === 0) {
        return Promise.reject(new Error('Unable to find requested projects'));
      }
      return projects;
    })
    .catch((error) => {
      return Promise.reject(new Error(error.message));
    });
  };
  
// adding the function to add the project to the database using create() function
// and then using Promise.resolve() to resolve the promise with no data once the project is created
const addProject = (projectData) => {
    return Project.create(projectData)
      .then(() => {
        return Promise.resolve(); // Resolve the promise with no data once the project is created
      })
      .catch((err) => {
        return Promise.reject(new Error(err.errors[0].message)); // Reject with a human-readable error message
      });
  };

  // adding the function to get all the sectors from the database using findAll() function
  const getAllSectors = () => {
    return Sector.findAll();
};

const editProject = (id, projectData) => {
    return Project.update(projectData, { where: { id: id } });
};

const deleteProject = (id) => {
    return Project.destroy({ where: { id: id } });
};

// to make the functions available to other modules
module.exports = {initialize,getAllProjects,getProjectById,getProjectsBySector,getAllSectors,addProject,editProject,deleteProject,};