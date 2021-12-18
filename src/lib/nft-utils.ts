import * as anchor from "@project-serum/anchor";
import { CONNECTION, TREASURY as CYBERGOTHICA_WALLET } from "../config";
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import axios from "axios";

export const CANDY_MACHINE_PROGRAM = new anchor.web3.PublicKey(
	'cndyAnrLdpjq1Ssp1z8xxDsB8dxe7u4HL5Nxi2K5WXZ',
);

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
	'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
);

export const getUserTokenAccounts = async (pubkey: anchor.web3.PublicKey) => {
    
    console.log(
        await CONNECTION.getTokenAccountsByOwner(pubkey, { programId: TOKEN_PROGRAM_ID })
    );
}

export const GetInfoFromUrl = (yourUrl: string) => {
    var Httpreq = new XMLHttpRequest();
    Httpreq.open("GET", yourUrl, false);
    Httpreq.send(null);
    return Httpreq.responseText;          
}

export const sleep = (ms: number): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, ms));
};

export async function getNftsForOwner(ownerAddress: anchor.web3.PublicKey) {
	const allTokens: any = []
	const tokenAccounts = await CONNECTION.getParsedTokenAccountsByOwner(ownerAddress, {
	  programId: TOKEN_PROGRAM_ID
	});

	for (let index = 0; index < tokenAccounts.value.length; index++) {
	  const tokenAccount = tokenAccounts.value[index];
	  const tokenAmount = tokenAccount.account.data.parsed.info.tokenAmount;
      
	  if (tokenAmount.amount == "1" && tokenAmount.decimals == "0" && tokenAccount.account.data.parsed.info.owner == CYBERGOTHICA_WALLET) {
		try {
            let [pda] = await anchor.web3.PublicKey.findProgramAddress([
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                (new anchor.web3.PublicKey(tokenAccount.account.data.parsed.info.mint)).toBuffer(),
              ], TOKEN_METADATA_PROGRAM_ID);
              const accountInfo: any = await CONNECTION.getParsedAccountInfo(pda);
        
              const metadata: any = new Metadata(ownerAddress.toString(), accountInfo.value);
              const { data }: any = await axios.get(metadata.data.data.uri)
      
              if(data.collection.family != "CyberGothica") continue;
      
              //const entireData = { ...data, id: Number(data.name.replace( /^\D+/g, '').split(' - ')[0]) }
        
              //allTokens.push({ ...entireData })

			  allTokens.push({ Address: tokenAccount.account.data.parsed.info.mint, Name: data.name, ImageUrl: data.image })
        }
        catch (error: any) {
            console.log(error.toString());
        }
	  }
	  allTokens.sort(function (a: any, b: any) {
		if (a.name < b.name) { return -1; }
		if (a.name > b.name) { return 1; }
		return 0;
	  })
	}
  
	return allTokens
  }

export async function getNftMetadata(nftAddress: string) {
	let tokenmetaPubkey = await Metadata.getPDA(new anchor.web3.PublicKey(nftAddress));
	const tokenAccountMeta = await Metadata.load(CONNECTION, tokenmetaPubkey);

	if(CYBERGOTHICA_WALLET.toString() == tokenAccountMeta.data.updateAuthority) {
		const nftInfo = JSON.parse(GetInfoFromUrl(tokenAccountMeta.data.data.uri));

		if(nftInfo.collection.family = "CyberGothica")
			return nftInfo;
	}
	
	console.log("It is not CyberGothica's nft!");
	return null;
}