//This will allow us to access the value of PG_CONNECTION_STRING from the ".env" file 
require('dotenv').config();
require('pg');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.PG_CONNECTION_STRING, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true, // This will help you connect to the database with SSL
      rejectUnauthorized: false, // Allows self-signed certificates
    },
  },
});

const Sector = sequelize.define('Sector', 
  {
    id: 
    {
      type: Sequelize.INTEGER,
      primaryKey:true,
      autoIncrement: true,
    },
    sector_name: Sequelize.STRING,
  },
    {
      createdAt: false, // disable createdAt
      updatedAt: false, // disable updatedAt
    }
);


const Project = sequelize.define('Project',
  {
    id: 
    {
      type: Sequelize.INTEGER,
      primaryKey:true,
    },
    title:Sequelize.STRING,
    feature_img_url:Sequelize.STRING,
    summary_short:Sequelize.TEXT,
    intro_short:Sequelize.TEXT,
    impact:Sequelize.TEXT,
    original_source_url:Sequelize.STRING,
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  }
);

// adding the association between the two models  
Project.belongsTo(Sector, { foreignKey: 'sector_id' });


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
async function getAllProjects() {
  const projects = await Project.findAll({
    include: [Sector],
    order: [['id', 'ASC']]
    });
    
  return projects.map(project => project.toJSON());
}

// changing the code to get the project by id from the database using findOne() function

async function getProjectByID(projectId) {
  try {
    const data = await Project.findOne(
      {
       include: [Sector],
       where: { id:projectId } 
      })
    
    if (!data) {
      // send to catch
      throw new Error("Unable to find requested project");
    } 
    
    return data.toJSON();

   // catches and throws to calling function 
  } catch(err) {
    throw err.message;
  }
}

async function getProjectsBySector(sector) {
  try {
    const projects = await Project.findAll(
    {
        include: [Sector], 
        where: {
      '$Sector.sector_name$': {
      [Sequelize.Op.iLike]: `%${sector}%`
      }}
    });

    // in case no project found
    // [] is an object, triggers a resolve
    if(!projects || projects.length == 0) {
      throw new Error("Unable to find requested projects");
    }
  
    return projects.map(project => project.toJSON());
  } catch (err)  {
     throw err.message;
  }
}


async function addProject(projectData) {
  try 
  {
    const lastID = await Project.findOne({ order: [['id', 'DESC']] });
    const newID = lastID ? lastID.id + 1 : 1;

    sequelize.sync().then(() => {
        Project.create({
            id:newID,
            title: projectData.title,
            feature_img_url: projectData.feature_img_url,
            summary_short: projectData.summary_short,
            intro_short: projectData.intro_short,
            impact: projectData.impact,
            original_source_url: projectData.original_source_url,
            sector_id: projectData.sector_id
        }).then(() => {
          console.log("New project added")
        }).catch((err) => {
          throw err;
        })
    });

  } catch(err) {
    throw err.errors[0].message;
  }
}

  // adding the function to get all the sectors from the database using findAll() function
  async function getAllSectors() {
    const data = await Sector.findAll();
    return data.map(sector => sector.toJSON());
}
const editProject = (id, projectData) => {
    return Project.update(projectData, { where: { id: id } });
};

const deleteProject = (id) => {
    return Project.destroy({ where: { id: id } });
};

// to make the functions available to other modules
module.exports = {initialize,getAllProjects,getProjectByID,getProjectsBySector,getAllSectors,addProject,editProject,deleteProject,};