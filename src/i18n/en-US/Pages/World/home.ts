import { MessageSchema } from 'src/boot/i18n';

export const enUSHome: MessageSchema['home'] = {
  worldName: {
    title: 'World Name',
    enterName: 'Enter your world name'
  },
  version: {
    title: 'Versions',
    serverType: 'Select the Server Type',
    versionType: 'Select the Server Version',
    allVersions: 'All versions',
    onlyReleased: 'Only released',
    buildNumber: 'Build number',
    notChange: '(No change required)',
    recommend: 'Recommended',
    installer: 'Installer',
    loader: 'Loader',
    latestSnapshot: 'Latest snapshot',
    latestRelease: 'Latest release',
    latestVersion: 'Latest version'
  },
  serverType: {
    vanilla: 'Vanilla (Official)',
    spigot: 'Spigot',
    papermc: 'PaperMC',
    forge: 'Forge',
    mohistmc: 'MohistMC',
    fabric: 'Fabric'
  },
  serverDescription: {
    vanilla: 'Official Minecraft server. Provides standard multiplay server.',
    spigot: 'Typical third party server. Allows plugins to be installed.',
    papermc: 'A server that makes Spigot run more lightly',
    forge: 'Most common servers as prerequisite servers for mods',
    mohistmc: 'Server based on Forge, but allows both mods and plugins to be installed',
    fabric: 'The premise server for the mods, which is a different system from Forge.'
  },
  icon: 'Change server icon',
  ngrok: {
    title: 'No need to PORT MAPPING',
    desc: '\
      This feature allows you to invite your friends to join your server without having to configure the \"PORT MAPPING\".<br/>\
      Get ready for all the multi-play settings with ServerStarter2!',
    descWarningNoRegist: 'This setting can only be set when all servers are stopped',
    descWarningRegisted: 'Token updates can only be set when all servers are stopped',
    btn: 'Configure this feature',
    btnRegisted: 'Update your token',
    toggleON: 'Using this feature',
    toggleOFF: 'Not using this feature',
    dialog: {
      firstPage: {
        title: 'Firstly',
        desc: '\
          This software uses a tool called Ngrok to eliminate the need to open ports.<br>\
          If you do not have an account, please create a new account.<br>\
          (*<u>This software is designed to be used with a free account</u>, although paid accounts are also available',
        register: 'Create a new account',
        alreadyRegistered: 'Already have an account?'
      },
      secondPage: {
        title: 'Sign up',
        dialogTitle : 'Follow the prompts to complete your account registration!',
        signup: {
          desc: 'To register for an Ngrok account,{0}',
          link: 'please click here for the sign up page.',
          register: 'Fill in the blanks and click Sign up!',
        },
        auth: {
          title: 'Email verification',
          desc: 'You will receive an Email from Ngrok to your registered Email address. Click on the URL in the Email to complete the verification.',
        },
        question: {
          title: 'Responses to Questionnaire',
          desc: 'Registration is now complete, but please answer the questionnaire from Ngrok at the end, as shown in the image.',
        },
        howToConnect: {
          title: 'How to connect',
          desc: 'When you start the server, you will see an IP address in the upper right corner <b><u>that changes value each time the server is started</u></b>.',
          connect: 'You can connect to the server by entering this address into the Server Address of the Minecraft!',
        },
      },
      thirdPage: {
        title: 'Register token',
        desc: '\
        Connect your Ngrok account to ServerStarter2{0}\
        Open {1} and input the displayed token below\
        ',
        link: 'page to get an authentication token',
        inputToken: 'Input Token'
      },
      goNext: 'Go next setting',
      save: 'Save your registration',
      imageDetail: 'Image Detail',
    }
  },
  setting: {
    title: 'Start up settings',
    memSize: 'memory size',
    jvmArgument: 'Minecraft JVM arguments'
  },
  deleteWorld: {
    title: 'Delete World',
    button: 'Delete your world data',
    titleDesc: '\
      If you delete this world, you can not recover your world data in any way.<br>\
      Please be careful to execute.',
    dialogTitle: 'Delete your world data',
    dialogDesc: '\
      Your {deleteName} data will be deleted permanently.<br>\
      Are you sure to delete the world data?'
  },
  error: {
    title: 'Warning!',
    failedGetVersion: '\
        Failed to get the version {serverVersion}.<br>\
        You can not choose this server.',
    failedDelete: 'Failed to delete {serverName} which does not exist'
  },
  init: {
    save: 'Save world settings',
    discard: 'Discard world settings'
  },
};