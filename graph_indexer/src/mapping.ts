import {
  Transfer as TransferEvent,
  NFTweet as NFTweetContract
} from "../generated/NFTweet/NFTweet"
import { Ownership, Tweet, User } from "../generated/schema"

export function handleTransfer(event: TransferEvent): void {
  // Get the user (or make a new one if needed)
  let user = User.load(event.params.to.toHexString())
  if (user == null) {
    user = new User(event.params.to.toHexString())
    user.save()
  }

  // See if tweet has already been minted
  let tweet = Tweet.load(event.params.tokenId.toString())
  if (tweet != null) {
    // End previous ownership
    let prevOwnership = Ownership.load(tweet.currentOwnership)
    prevOwnership.end = event.block.timestamp
    prevOwnership.save()
  } else {
    // Create new tweet
    tweet = new Tweet(event.params.tokenId.toString())
    tweet.tweetID = event.params.tokenId
    let nftweetContract = NFTweetContract.bind(event.address)
    tweet.metadataURI = nftweetContract.tokenURI(event.params.tokenId)
  }

  // Create new ownership
  let ownership = new Ownership(event.transaction.hash.toHexString())
  ownership.user = user.id
  ownership.tweet = tweet.id
  ownership.start = event.block.timestamp
  ownership.save()

  tweet.currentOwnership = event.transaction.hash.toHexString();
  tweet.save()
}
