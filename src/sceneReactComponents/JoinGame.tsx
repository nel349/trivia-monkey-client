import { useContext, useEffect, useState } from 'react';
import { enterChannelListenerWrapper } from '../ably/ChannelListener';
import { SignerContext } from '../components/SignerContext';
import { Messages } from '../utils/Messages';
import { useLocation, useNavigate } from 'react-router-dom';
import { SessionDataContext } from '../components/SessionDataContext';
import queryString from 'query-string';
import { Badge, Button, Group, Modal } from '@mantine/core';
import ModalContent from '../components/ModalContent';
import { useDisclosure } from '@mantine/hooks';
import { getSession, updateTopics } from '../polybase/SessionHandler';
import { generateQuestions } from '../game-domain/GenerateQuestionsHandler';
import { addQuestions } from '../polybase/QuestionsHandler';

const JoinGame = () => {
    const [channelId, setChannelId] = useState('');
    const { web3auth } = useContext(SignerContext);
    const navigate = useNavigate();
    const {sessionData, setSessionData } = useContext(SessionDataContext);
    const location = useLocation();
    const [opened, { open, close }] = useDisclosure(false);
    const [selectedChips, setSelectedChips] = useState<string[]>([]);
    const [numberPlayers, setNumberPlayers] = useState<number>(0);

    useEffect(() => {
        const handleAllPlayersJoined = (event: any) => {
            console.log('All players have joined', event.detail);
            setSessionData(event.detail);
            // Handle the event here
            // navigate('/spinwheel');
        };

        window.addEventListener(Messages.ALL_PLAYERS_JOINED, handleAllPlayersJoined);

        // Cleanup listener when component unmounts
        return () => {
            window.removeEventListener(Messages.ALL_PLAYERS_JOINED, handleAllPlayersJoined);
        };
    }, []);

    useEffect(() => {
        const parsed = queryString.parse(location.search);
        const { sessionId, channelId } = parsed;

        if (sessionId && channelId) {
            getSession({ id: sessionId }).then((sessionData) => {
                setNumberPlayers(parseInt(sessionData.numberPlayers));
                setSessionData({
                    sessionId: sessionId as string,
                    channelId: channelId as string,
                    clientId: '',
                    questionSessionId: sessionData.questionSessionId
                    });
            });
            setChannelId(channelId as string);
            // handleJoinGame({ channelId });
        }
    }, [location]);

    const handleJoinGame = async (data: any) => {
        if (web3auth) {
            await enterChannelListenerWrapper(web3auth, data);

            // Generate questions
            generateQuestions({topics: selectedChips})
            .then((result) => {
                // console.log('generateQuestions response: ', result);
                addQuestions({id: sessionData?.questionSessionId, column: 1, topics: result});
            });
            // Update topics to Game session
            await updateTopics({id:sessionData?.sessionId, topics: selectedChips})
            // console.log('updatedTopics response:', addTopicResponse);
        }
    };

    const handleJoinButtonClick = () => {
        if (channelId !== '') {
            handleJoinGame({ channelId });
            navigate('/spinwheel');
        }
    };

    return (
        <div>
            <h1>Select topics and Join</h1>
            <input type="text" placeholder="Channel id" value={channelId} onChange={e => setChannelId(e.target.value)} />
            

            <Modal opened={opened} onClose={close} title="Pick topic" radius={'lg'} padding={'xl'}>
                <ModalContent setSelectedChips={setSelectedChips} numberOfPlayers={numberPlayers}></ModalContent>
                {/* Modal content */}
            </Modal>
            <Group justify="center">
                <Badge size="lg" radius="lg" variant="dot">Selected topics: {selectedChips.join(', ')}</Badge>
                <Button onClick={open}>Pick a topic</Button>
            </Group>

            <Button onClick={handleJoinButtonClick} variant="gradient" gradient={{ from: 'orange', to: 'red' }}>Join</Button>
        </div>

    );
};

export default JoinGame;