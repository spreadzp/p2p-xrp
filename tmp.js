export default class App extends Vue {
    private peers: any[] = [];
    private valPeers: { peer: any, connection: number }[] = [];
    private libp2p: Libp2p;
    private myPeerId: string = "";
    private otherPeerId: string = "";
    private otherPeerMultiaddrs: any[] = [];
    private otherPeerProtocols: string[] = [];
    private otherPeerMultiaddr: string = "";
    private otherPeerProtocol: string = "";
    private remotePeerId: any = "";
    private chatMessage: string = "";
    private messages: string[] = [];
    private chatQueue: any = false;
    private chatProposals: string[] = [];
    private proposals: string[] = [];
    private creditMessage: string = "";
    private creditInfo: string = "";
    private userRole: string = "";
    private showWindowTx = false;
    async init() {
        try {
            this.libp2p = await Libp2p.create({
                addresses: {
                    listen: [
                        "/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star",
                        "/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star",
                    ],
                },
                modules: {
                    transport: [Websockets, WebRTCStar],
                    connEncryption: [NOISE],
                    streamMuxer: [Mplex],
                    peerDiscovery: [Bootstrap],
                    dht: KadDHT,
                },
                config: {
                    peerDiscovery: {
                        [Bootstrap.tag]: {
                            enabled: true,
                            list: [
                                "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
                                "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
                                "/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp",
                                "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
                                "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt",
                            ],
                        },
                    },
                    dht: {
                        enabled: true,
                    },
                },
            });
            await this.libp2p.start()
            this.myPeerId = this.libp2p.peerId.toB58String();
            if (this.myPeerId) {


            }


            this.libp2p.handle(chatProtocol, ({ connection, stream, protocol }) => {
                this.remotePeerId = connection.remoteAddr.getPeerId();
                pipe(
                    stream,
                    (source) => {
                        return (async function* () {
                            for await (const buf of source) yield array2str(buf.slice());
                        })();
                    },
                    async (source) => {
                        for await (const msg of source) {
                            const msgObj = JSON.parse(msg);
                            if (msgObj.type === "message") {
                                this.messages.push(`<h1>${msgObj.data}</h1>`);
                            } else if (msgObj.type === "proposal") {
                                const script = document.createElement('script');
                                let code = msgObj.src.replaceAll(/<\/?[^<>]*>/g, "");
                                var inlineScript = document.createTextNode(code);
                                script.appendChild(inlineScript);

                                document.body.appendChild(script);
                                this.chatProposals.push(msgObj.data)
                            } else if (msgObj.type === "creditRequest") {
                                const script = document.createElement('script');
                                let code = msgObj.src.replaceAll(/<\/?[^<>]*>/g, "");
                                var inlineScript = document.createTextNode(code);
                                script.appendChild(inlineScript);

                                document.body.appendChild(script);
                                this.chatProposals.push(msgObj.data)
                                this.messages.push(`<h1>${JSON.parse(msgObj.data)}</h1>`);
                            } else {
                                this.messages.push(`<h1>${msg.toString()}</h1>`);
                            }

                        }
                    }
                );
            });
        }
    }

    checkPeer = async (id) => {
        let peerId = PeerId.parse(id);
        if (this.libp2p) {
            return await this.libp2p.peerRouting.findPeer(peerId);
        }
    };
    async validatePeers() {
        if (this.valPeers.length > 0) {
            await Promise.all(
                this.valPeers.array.forEach(async (item) => {
                    if (item.peer.peerId !== this.myPeerId) {
                        this.checkPeer(item.peer.peerId).then((result) => {
                            console.log('peer :>> ', item.peer.peerId);
                            console.log("🚀 ~ file: App.vue ~ line 161 ~ App ~ this.checkPeer ~ result", result)
                            if (!result) {
                                console.log(`peer has problem to connect :>> ${item.peer.peerId}`);
                                --item.connection;
                                if (item.connection < 1) {
                                    fetch(
                                        `https://us-central1-p2pserver-e8ed6.cloudfunctions.net/removePeer?peerId=${item.peer.peerId}`
                                    )
                                        .then((res) => {
                                            return res.json();
                                        })
                                        .then((data) => console.log("data :>> ", data))
                                        .catch((err) => console.log("err :>> ", err));
                                }

                            }
                        });
                    }
                })
            );
        }
    }
    async getActivePeers() {
        fetch("https://us-central1-p2pserver-e8ed6.cloudfunctions.net/getTopPeers?limit=10")
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                this.peers = [];
                console.log(data);
                data?.map((item) => {
                    this.peers.push(item);
                    this.valPeers.push({ peer: item, connection: 5 })
                });
            });
    }
    mounted() {
        this.init();
        this.getActivePeers();
        setInterval(() => this.getActivePeers(), 10000);

        if (this.userRole = "validator") {
            this.validatePeers();
            setInterval(() => this.validatePeers(), 10000);

        }

    }

    async submitRole() {
        if (document.getElementById("borrower").checked) { this.userRole = "borrower" }
        if (document.getElementById("loaner").checked) { this.userRole = "loaner" }
        if (document.getElementById("validator").checked) { this.userRole = "validator" }
        if (this.userRole !== "") {
            await this.sendMyPeerId(this.myPeerId);
        }
    }

    async getAccount(type) {
        type = 'standby'
        let net = this.getNet()
        let wallet = await localStorage.getItem("wallet")
        const client = new xrpl.Client(net)
        await client.connect()
        if (wallet === null) {

            let results = 'Connecting to ' + net + '....'

            // This uses the default faucet for Testnet/Devnet
            let faucetHost = "faucet-nft.ripple.com";
            if (type == 'standby') {
                document.getElementById('standbyResultField').value = results
            } else {
                document.getElementById('operationalResultField').value = results
            }

            results += '\nConnected, funding wallet.'
            if (type == 'standby') {
                document.getElementById('standbyResultField').value = results
            } else {
                document.getElementById('operationalResultField').value = results
            }

            // -----------------------------------Create and fund a test account wallet
            const my_wallet = (await client.fundWallet(null, { faucetHost })).wallet

            results += '\nGot a wallet.'
            if (type == 'standby') {
                document.getElementById('standbyResultField').value = results
            }

            // -----------------------------------Get the current balance.
            const my_balance = (await client.getXrpBalance(my_wallet.address))

            if (type == 'standby') {
                document.getElementById('standbyAccountField').value = my_wallet.address
                document.getElementById('standbyPubKeyField').value = my_wallet.publicKey
                document.getElementById('standbyPrivKeyField').value = my_wallet.privateKey
                document.getElementById('standbyBalanceField').value =
                    (await client.getXrpBalance(my_wallet.address))
                document.getElementById('standbySeedField').value = my_wallet.seed
                results += '\nStandby account created.'
                document.getElementById('standbyResultField').value = results
                if (my_wallet) {
                    window.localStorage.setItem("net", 'standby');
                    window.localStorage.setItem("wallet", JSON.stringify(my_wallet));
                }
            }
        } else {
            const wallet = JSON.parse(await localStorage.getItem("wallet"));
            const bal = await client.getXrpBalance(wallet.classicAddress)
            document.getElementById('standbyAccountField').value = wallet.classicAddress;
            document.getElementById('standbyPubKeyField').value = wallet.publicKey;
            document.getElementById('standbyPrivKeyField').value = wallet.privateKey;
            document.getElementById('standbySeedField').value = wallet.seed;
            document.getElementById('standbyBalanceField').value = bal;
        }
    }


    getNet() {
        return "wss://s.altnet.rippletest.net:51233"
    }

    async sendXRP() {
        this.showWindowTx = true;
        let results = "Connecting to the selected ledger.\n"
        document.getElementById('standbyResultField').value = results
        let net = this.getNet()
        results = 'Connecting to ' + this.getNet() + '....'
        const client = new xrpl.Client(net)
        await client.connect()

        results += "\nConnected. Sending XRP.\n"
        document.getElementById('standbyResultField').value = results

        const standby_wallet = xrpl.Wallet.fromSeed(standbySeedField.value)
        const sendAmount = standbyAmountField.value

        results += "\nstandby_wallet.address: = " + standby_wallet.address
        document.getElementById('standbyResultField').value = results

        // ------------------------------------------------------- Prepare transaction
        // Note that the destination is hard coded.
        const prepared = await client.autofill({
            "TransactionType": "Payment",
            "Account": standby_wallet.address,
            "Amount": xrpl.xrpToDrops(sendAmount),
            "Destination": standbyDestinationField.value
        })
        console.log("🚀 ~ file: App.vue ~ line 497 ~ App ~ sendXRP ~ prepared", prepared)

        // ------------------------------------------------ Sign prepared instructions
        const signed = standby_wallet.sign(prepared)
        console.log("🚀 ~ file: App.vue ~ line 501 ~ App ~ sendXRP ~ signed", signed)

        // -------------------------------------------------------- Submit signed blob
        const tx = await client.submitAndWait(signed.tx_blob)

        results += "\nBalance changes: " +
            JSON.stringify(xrpl.getBalanceChanges(tx.result.meta), null, 2)
        document.getElementById('standbyResultField').value = results

        document.getElementById('standbyBalanceField').value =
            (await client.getXrpBalance(standby_wallet.address))
        client.disconnect()
        if (tx) {
            setTimeout(() => {
                this.showWindowTx = false;
            }, 10000);
        }
    }

    async signInfo() {
        let net = this.getNet()
        let results = 'Connecting to ' + this.getNet() + '....'
        const client = new xrpl.Client(net)
        const wallet = JSON.parse(localStorage.getItem("wallet"));
        const operational_wallet = xrpl.Wallet.fromSeed(wallet.seed)
        await client.connect()
        const creditData = document.getElementById("singInfo").value
        const jsonRes = JSON.parse(creditData)
        const str = `<div> <h1>Proposal</h1> <button onclick="creditRequest()">Approve credit</button> </div>`;
        const withoutLineBreaks = str.replace(/[\r\n]/gm, '');
        const myPeerId = document.getElementById("myPeerId").innerText;
        const dataForSend = {
            "type": "creditRequest",
            "data": withoutLineBreaks,
            "src": `<script>function creditRequest() { 
            debugger
            const creditInfo = {
              peerId: "${myPeerId}",
              xrpAddress: "${wallet.classicAddress}",
              amount: "${jsonRes.amount}",
              kycInfo: true,  
              longitude: 152,
              latitude: 111,
              userName: "Rob",
              timeRequest: "${Date.now()}"
            }
          document.getElementById("standbyAmountField").value = creditInfo.amount; 
          document.getElementById("standbyDestinationField").value = creditInfo.xrpAddress;
          }<\/script>`
        }
        this.chatQueue.push(JSON.stringify(dataForSend));
        this.proposals.push("< " + dataForSend.type + " " + new Date().toLocaleDateString());
    }

    choicePeer(peer) {
        this.otherPeerId = peer;
    }

    async findOtherPeer() {
        let peerId = PeerId.parse(this.otherPeerId);
        let result = await this.libp2p.peerRouting.findPeer(peerId);
        this.otherPeerMultiaddrs = result.multiaddrs;
        this.otherPeerProtocols = this.libp2p.peerStore.protoBook.get(peerId);
        this.otherPeerMultiaddr = this.otherPeerMultiaddrs[0];
        this.otherPeerProtocol = chatProtocol;
    }

    async sendMyPeerId(peerId: string) {
        const wallet = JSON.parse(localStorage.getItem("wallet"));
        if (this.userRole) {

            const data = {
                peerId: peerId,
                status: this.userRole,
                xrpAddress: wallet.classicAddress,
                name: wallet.classicAddress,
                kycData: true,
                latitude: "111",
                longitude: "888",
                dateTime: Date.now(),
            };
            const response = await fetch(
                "https://us-central1-p2pserver-e8ed6.cloudfunctions.net/addPeer",
                {
                    method: "POST",
                    mode: "cors",
                    cache: "no-cache",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    redirect: "follow",
                    referrerPolicy: "no-referrer",
                    body: JSON.stringify(data),
                }
            );
            return await response.json();
        }
    }

    async dialProtocol() {
        let peerId = PeerId.parse(this.otherPeerId);
        const { stream, protocol } = await this.libp2p.dialProtocol(peerId, chatProtocol);
        this.chatQueue = pushable();
        pipe(
            this.chatQueue,
            (source) => {
                return (async function* () {
                    for await (const msg of source) yield str2array(msg);
                })();
            },
            stream
        );
    }

    sendMessage() {
        const dataForSend = {
            "type": "message",
            "data": this.chatMessage
        }

        this.chatQueue.push(JSON.stringify(dataForSend));
        this.messages.push("< " + this.chatMessage);
        this.chatMessage = "";
    }

    getCredit() {
        this.creditInfo = "Get credit";
    }

    sendProposal() {
        const str = `<div> <h1>Proposal</h1> <button onclick="getCredit()">get credit</button> </div>`;
        const withoutLineBreaks = str.replace(/[\r\n]/gm, '');
        const dataForSend = {
            "type": "proposal",
            "data": withoutLineBreaks,
            "src": `<script>function getCredit() {
          const id = document.getElementById("myPeerId").innerText;  
          const wallet = JSON.parse(localStorage.getItem("wallet"));
            console.log(wallet);
          const creditInfo = {
            peerId: id,
            xrpAddress: wallet.classicAddress,
            amount: 100,
            kycInfo: true,
            longitude: 152,
            latitude: 111,
            userName: "Rob",
            timeRequest: Date.now()
          }
          document.getElementById("singInfo").value = JSON.stringify(creditInfo); 
          console.log(id);
          }<\/script>`

        }

        this.chatQueue.push(JSON.stringify(dataForSend));
        this.proposals.push("< " + dataForSend.type + " " + new Date().toLocaleDateString());
    }
}