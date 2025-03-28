require('dotenv').config();
require('pg');

const Sequelize = require('sequelize');

// set up sequelize to point to our postgres database
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

Project.belongsTo(Sector, {foreignKey: 'sector_id'});

async function initialize() {
  try {
    await sequelize.sync();
    console.log("Sync success");
  } catch (err) {
    console.error("Failed to sync ending with: ", err);
  }
}

async function getAllProjects() {
    const projects = await Project.findAll({
      include: [Sector],
      order: [['id', 'ASC']]
      });
      
    return projects.map(project => project.toJSON());
}

async function getAllSectors() {
    const data = await Sector.findAll();
    return data.map(sector => sector.toJSON());
}

async function addProject(projectData) {
    try 
    {
      const lastID = await Project.findOne({ order: [['id', 'DESC']] });
      const newID = lastID ? lastID.id + 1 : 1;

      sequelize.sync().then(() => {
          Project.create({
              id:parseInt(newID),
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

function editProject(Newid, projectData) {
  try {
    return sequelize.sync().then(() => {
      return Project.update(
        {
            title: projectData.title,
            feature_img_url: projectData.feature_img_url,
            summary_short: projectData.summary_short,
            intro_short: projectData.intro_short,
            impact: projectData.impact,
            original_source_url: projectData.original_source_url,
            sector_id: projectData.sector_id
        }, 
        {
            where: { id: parseInt(Newid) } 
            // only update project with input id
        })
        .then(() => {
            console.log("then in edit project");
        }).catch((err) => {
            console.log("catch in edit project");
            throw err;
        });
    });

  } catch(err) {
    throw err.errors[0].message;
  }
}

async function deleteProject(id) {
  try 
  {
    await Project.destroy({
      where: {id:parseInt(id)}
    });
  } catch(err) {
    return err.errors[0].message;
  }

}

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

module.exports = {
  initialize,
  getAllProjects,
  getProjectByID,
  getProjectsBySector,
  getAllSectors,
  addProject,
  editProject,
  deleteProject
};
