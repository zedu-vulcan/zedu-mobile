import {
  createContext,
  useEffect,
  useReducer,
  ReactNode,
  Dispatch,
} from 'react';
import { setUnauthorizedListener } from '@/utils/requests';
import reducers, { AppState } from './Reducers';
import { Action, ACTIONS } from './types';

// Define the context shape
interface ContextProps {
  state: AppState;
  dispatch: Dispatch<Action>;
}

export const DataContext = createContext<ContextProps | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const initialState: AppState = {
    // auth
    token: null,
    user: null,
    success: null,
    error: null,
    callback: false,
    authFlow: null,
    userTyping: [],
    chatSubscription: null,
    channelSubscription: null,
    replySubscription: null,

    // organisation
    orgId: null,
    orgData: null,
    org: [],
    orgMembers: [],
    orgCallback: false,

    // dms
    dms: [],
    dmsChat: [],
    singleDmsChat: [],
    dmLoading: true,
    participant: [],
    singleParticipant: [],
    receiver: null,
    media: [],
    uploading: false,
    groupDetails: null,
    groupCallback: false,
    selectedMsg: null,

    // channels
    userChannels: [],
    allChannels: [],
    channelLoading: true,
    channelsChat: [],
    replyChat: [],
    channelDetails: null,
    channel: null,
    channelCallback: false,
    replyCallback: false,

    // agents
    agents: [],
    agent: null,
    agentsChat: [],
    agentCallback: false,

    // buzz
    hasJoined: false,
    buzzData: null,
    buzzParticipants: [],
    buzzChats: [],
    floatingEmojis: [],
    buzzIsMuted: true,
    buzzShowVideo: false,
    buzzIsScreenSharing: false,
    buzzJoinLoading: false,
    isCallMinimized: false,
    minimizedFrom: null,

    // settings
    statusCallback: false,
    billings: [],

    // mentions
    mentionsList: [],
    unseenThreadCount: 0,
    loadThreadCallback: false,
    mentionUser: false,
  };

  const [state, dispatch] = useReducer(reducers, initialState);

  // A 401 has already cleared saved auth; clear the in-memory session too so
  // the navigator returns to Sign in instead of staying on signed-in screens.
  useEffect(() => {
    setUnauthorizedListener(() => {
      dispatch({ type: ACTIONS.TOKEN, payload: null });
      dispatch({ type: ACTIONS.USER, payload: null });
      dispatch({ type: ACTIONS.ORG_DATA, payload: null });
      dispatch({ type: ACTIONS.USER_CHANNELS, payload: [] });
      dispatch({ type: ACTIONS.DMS, payload: [] });
      dispatch({ type: ACTIONS.DMS_CHAT, payload: { data: [], page: 1 } });
    });
    return () => setUnauthorizedListener(null);
  }, []);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
};
