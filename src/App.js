import React, {Suspense, useState } from "react";
import './App.css';
import * as THREE from "three";
import {PLYExporter} from "three/examples/jsm/exporters/PLYExporter";
import {createTheme, ThemeProvider} from '@mui/material/styles';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import {Canvas, useThree } from "@react-three/fiber";
import {OrbitControls, Center} from "@react-three/drei";
import {saveAs} from "file-saver";
import { TextureLoader } from "three";

const newTheme = createTheme();
let scene, list_model_objects;
let i = 0;

// Model Constructor
class ModelObject {
  constructor(
    model_type,
    traslation_x,traslation_y,traslation_z,
    scale_x,scale_y,scale_z,
    rotation_x,rotation_y,rotation_z
  ) {
    this.model_type = model_type;
    this.traslation_x = traslation_x;
    this.traslation_y = traslation_y;
    this.traslation_z = traslation_z;
    this.scale_x = scale_x;
    this.scale_y = scale_y;
    this.scale_z = scale_z;
    this.rotation_x = rotation_x;
    this.rotation_y = rotation_y;
    this.rotation_z = rotation_z;
  }
}

export function App() {
  const [value, setValue] = useState("");
  const [shapesOnCanvas,setShapesOnCanvas] = useState([]);

  // In case one wants to use a texture on the model
  // const textureLoader = new TextureLoader();
  // const texture = textureLoader.load("puppy.jpg");


  function Shape(props) {
    // State
    scene = useThree(state => state.scene);

    // Define Shapes
    const allShapes= {
      cube: new THREE.BoxGeometry( 1, 1, 1 ),
      cylinder: new THREE.CylinderGeometry( 0.5, 0.5, 1, 32 ),
      sphere : new THREE.SphereGeometry( 0.5, 32, 16 ),
      cone : new THREE.ConeGeometry( 0.5, 1, 32 ),
      pyramid : new THREE.ConeGeometry( 0.7071067811865475, 1, 4 )
    }

    // Position adjustment
    let position_x = props.shape.traslation_x + props.shape.scale_x/2.0;
    let position_y = props.shape.traslation_y + props.shape.scale_y/2.0;
    let position_z = props.shape.traslation_z + props.shape.scale_z/2.0;

    return (
      <mesh 
        {...props}
        position={[position_x,position_y,position_z]}
        rotation={[props.shape.rotation_x * Math.PI / 180, props.shape.rotation_y * Math.PI / 180, props.shape.rotation_z * Math.PI / 180]}
        scale={[props.shape.scale_x,props.shape.scale_y,props.shape.scale_z]}
      >
        <primitive object={allShapes[props.shape.model_type]} attach={"geometry"} />
        <meshNormalMaterial attach="material" />

        {/* // Switch the above command with the following in case of textures
        <meshStandardMaterial attach="material" map={texture} /> */}
      </mesh>
    );
  }

  // PLY exporter for the models
  function downloadFile() {
    const exporter = new PLYExporter();
    exporter.parse(scene, function (plyJson) {
      const blob = new Blob([plyJson], { type: "application/json" });
      saveAs(blob, "cga-model.ply");
    }, { binary: false });
  }

  // Mesh generation
  function generateMesh() {

    setShapesOnCanvas([]);

    let aux_list = [];
    for(const model_object of list_model_objects){
      console.log(model_object);
      aux_list.push(<Shape 
        shape={model_object}
        key={i}
        />);
      setShapesOnCanvas(
        aux_list
      );
      i++;
    }
  }

  // CGA Syntax processing
  function processCGAScript(){

    // General declarations
    let script = value.replace(/\s+/g,'');
    let index = script.lastIndexOf('(');

    let model_type,
    translation_x,
    translation_y,
    translation_z,
    scale_x,
    scale_y,
    scale_z,
    rotation_x,
    rotation_y,
    rotation_z;

    // Error alert
    if(index === -1 || script[index - 1] !== 'I')
    {
      alert('Could not process the syntax. Last letter is not I. Please try again.');
      return;
    }

    // Initializations
    model_type = null;
    translation_x = 0;
    translation_y = 0;
    translation_z = 0;
    scale_x = 1;
    scale_y = 1;
    scale_z = 1;
    rotation_x = 0;
    rotation_y = 0;
    rotation_z = 0;
    list_model_objects = [];

    while(script !== '')
    {
      index = script.lastIndexOf('(');

      // Instancing
      if(script[index - 1] === 'I')
      {
        if(model_type != null)
        {
          list_model_objects.push(new ModelObject(
            model_type,
            translation_x,
            translation_y,
            translation_z,
            scale_x,
            scale_y,
            scale_z,
            rotation_x,
            rotation_y,
            rotation_z
          ));
          model_type = null;
          translation_x = 0;
          translation_y = 0;
          translation_z = 0;
          scale_x = 1;
          scale_y = 1;
          scale_z = 1;
          rotation_x = 0;
          rotation_y = 0;
          rotation_z = 0;
        }

        model_type = script.slice(index + 2,script.length - 2);

        if(
          model_type === 'cube' || model_type === 'cylinder' ||
          model_type === 'sphere' || model_type === 'cone' || 
          model_type === 'pyramid'
        ){
          script = script.slice(0,index);
        } else {
          alert('Could not process the syntax. Model type not recognized. Please try again.');
          return;
        }
        
      }
      // Translations
      else if(script[index - 1] === 'T')
      {
        let traslation_script = script.slice(index + 1,script.length - 1);
        const my_array = traslation_script.split(",");
        translation_x = parseFloat(my_array[0]);
        translation_y = parseFloat(my_array[1]);
        translation_z = parseFloat(my_array[2]);
        script = script.slice(0,index);
      }
      // Scales
      else if(script[index - 1] === 'S')
      {
        let scale_script = script.slice(index + 1,script.length - 1);
        const my_array = scale_script.split(",");
        scale_x = parseFloat(my_array[0]);
        scale_y = parseFloat(my_array[1]);
        scale_z = parseFloat(my_array[2]);
        script = script.slice(0,index);
      }
      // Rotations
      else if(script[index - 1] === 'R')
      {
        let rotation_script = script.slice(index + 1,script.length - 1);
        const my_array = rotation_script.split(",");
        rotation_x = parseFloat(my_array[0]);
        rotation_y = parseFloat(my_array[1]);
        rotation_z = parseFloat(my_array[2]);
        script = script.slice(0,index);
      }
      // Else, error, try again
      else
      {
        alert('Could not process the syntax. Letter not recognized. Please try again.');
        return;
      }
      script = script.slice(0,script.length - 1);
      if(index === -1)
      {
        alert('Could not process the syntax. Please try again.');
        return;
      }
    }
    // Case blank
    if(script === '')
    {
      list_model_objects.push(new ModelObject(
        model_type,
        translation_x,
        translation_y,
        translation_z,
        scale_x,
        scale_y,
        scale_z,
        rotation_x,
        rotation_y,
        rotation_z
      ));
    }

    // When the CGA finishes, generate the mesh
    generateMesh();
  };

  // UI Drawing
  return (
  <ThemeProvider theme={newTheme}>
    <Box component="main"
        sx={{
          backgroundColor: (theme) =>
          theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          display: 'flex'
        }}>
      <CssBaseline />
      <Container sx={{ mt: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={10}>
            <TextField
              id="outlined-textarea"
              label="Write CGA rules"
              placeholder="Ex: T(0,0,0) S(5,5,5) R(0,0,0) I('pyramid')"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
              }}
              multiline
              fullWidth
            />
          </Grid>
          <Grid item xs={2}>
            <Button 
              variant="contained"
              onClick={processCGAScript}
            >
              Try it out
            </Button>
          </Grid>
          <Grid item xs={4}>
          <Button
                variant="contained"
                onClick={downloadFile}
              >
                Export Model
              </Button>
          </Grid>
          <Grid item xs={9}>
          <Canvas className="canvas">
            <Center>
            <OrbitControls /*enableZoom={false}*/ />
            <ambientLight intensity={0.5} />
            <directionalLight position={[-2, 5, 2]} />
            <Suspense fallback={null}>
              {[...shapesOnCanvas]}
              <primitive object={new THREE.AxesHelper(10)} />
            </Suspense>
            </Center>
          </Canvas>
          </Grid>
          <Grid item xs={3}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography component="h2" variant="h5" paragraph>
                Documentation
              </Typography>
              <Typography component="h5" paragraph>
                <b>Navigation:</b>
                <Stack spacing={0}>
                  <span> • Left-Click:  Rotate camera view </span>
                  <span> • Right-Click: Move around        </span>
                  <span> • Mouse Wheel: Zoom in/out        </span>
                  
                </Stack>
              </Typography> 
              <Typography component="h5" paragraph>
                <b>Mesh Instancing:</b>
                <Stack spacing={0}>
                  <span> • Cube: I('cube')         </span>
                  <span> • Cone: I('cone')         </span>
                  <span> • Sphere: I('sphere')     </span>
                  <span> • Cylinder: I('cylinder') </span>
                  <span> • Pyramid: I('pyramid')   </span>
                </Stack>
              </Typography>                
              <Typography component="h5" paragraph>
                <b> Geometric Operations: </b>
                <Stack spacing={0}>
                  <span> • Traslation: T(2,1,3) - units   </span>
                  <span> • Rotation: R(0,90,0) - degrees  </span>
                  <span> • Scale: S(1,2,1) - units        </span>
                </Stack>
              </Typography>
              <Typography component="h5" >
              <b> Examples: </b>
              </Typography>
              <Typography component="h5">
              • Example 1 (Inspired by Pascal Müller's paper):
              </Typography>
              <Typography component="h5" variant="h10" spacing={0} paragraph>
                <span>
                T(1,0,0) R(0,0,0) S(6,7,2) I('cube')
                T(0,0,0) R(0,0,0) S(2,1,2) I('cube')
                T(0,7,0) R(0,0,0) S(2,2,2) I('sphere')
                T(0,0,0) R(0,0,0) S(2,8,2) I('cylinder')
                T(2,0,5) R(0,0,0) S(3,6,3) I('cube')
                T(2,6,5) R(0,45,0) S(3,1,3) I('pyramid')
                T(2,3.5,2) R(0,0,0) S(1,1,3) I('cube')
                </span>
              </Typography>
              <Typography component="h5">
              • Example 2 (Statue of Liberty):
              </Typography>
              <Typography component="h5" variant="h10" spacing={0} paragraph>
                <span>
                T(0,0,0) R(0,0,0) S(10,0.5,10) I('cube')
                T(4,0,4) R(0,0,0) S(3,10,3) I('cube')
                T(3,9,6) R(20,0,0) S(1,4,1) I('cube')
                T(3.25,11.3,7) R(0,0,0) S(0.5,2,0.5) I('cylinder')
                T(3,13.3,6.75) R(0,0,0) S(1,0.2,1) I('cylinder')
                T(3,13.5,7) R(0,0,20)  S(0.5,0.7,0.5) I('pyramid')
                T(3.55,13.5,7) R(0,0,-20) S(0.5,0.7,0.5) I('pyramid')
                T(3.3,13.5,7.25) R(20,0,0)   S(0.5,0.7,0.5) I('pyramid')
                T(3.3,13.5,6.75) R(-20,0,0)  S(0.5,0.7,0.5) I('pyramid')
                T(7,5,6) R(0,0,20) S(1,4,1) I('cube')
                T(7,5,7) R(0,0,-20) S(2,3,1) I('cube')
                T(4.5,10,4.5) R(0,0,0) S(2,2,2) I('sphere')
                T(4.5,11.6,4.5) R(0,0,0) S(2,0.4,2) I('cylinder')
                T(4.25,11.5,6) R(30,0,60) S(0.3,1,0.3) I('pyramid')
                T(5.375,11.5,6.5) R(60,0,0) S(0.3,1,0.3) I('pyramid')
                T(6.5,11.5,6) R(30,0,-60) S(0.3,1,0.3) I('pyramid')
                </span>
              </Typography>
            </Paper>              
          </Grid>
        </Grid>
      </Container>
    </Box>
  </ThemeProvider>
  );
  
}

export default App;
